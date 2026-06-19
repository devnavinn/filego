"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => {
            open: () => void;
            on: (event: string, handler: (response: unknown) => void) => void;
        };
    }
}

type RazorpaySuccessResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

export function UpgradeButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpgrade = async () => {
        try {
            setLoading(true);

            const orderRes = await fetch("/api/dashboard/billing/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const orderData = await orderRes.json().catch(() => null);

            if (!orderRes.ok) {
                alert(orderData?.error || "Failed to create order");
                setLoading(false);
                return;
            }

            if (!window.Razorpay) {
                alert("Razorpay SDK failed to load. Please refresh and try again.");
                setLoading(false);
                return;
            }
            const options = {
                key: orderData.data.key,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: "Filego",
                description: "Lifetime Premium Plan",
                order_id: orderData.data.orderId,
                prefill: orderData.data.prefill,
                theme: {
                    color: "#111111",
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    },
                },
                handler: async function (response: RazorpaySuccessResponse) {
                    try {
                        const verifyRes = await fetch("/api/dashboard/billing/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await verifyRes.json().catch(() => null);

                        if (!verifyRes.ok) {
                            alert(verifyData?.error || "Payment verification failed");
                            setLoading(false);
                            return;
                        }

                        router.refresh();
                    } catch (error) {
                        console.error("verify payment error", error);
                        alert("Payment completed, but verification failed. Please contact support.");
                        setLoading(false);
                    }
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", function () {
                alert("Payment failed. Please try again.");
                setLoading(false);
            });

            razorpay.open();
        } catch (error) {
            console.error("upgrade error", error);
            alert("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <Button
            id="upgrade-button"
            onClick={handleUpgrade}
            disabled={loading}
            className="rounded-xl bg-primary text-primary-foreground hover:opacity-90"
        >
            {loading ? "Processing..." : "Upgrade now"}
        </Button>
    );
}