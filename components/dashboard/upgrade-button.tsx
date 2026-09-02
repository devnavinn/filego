"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

type UpgradeButtonProps = {
    plan?: "LIFETIME" | "PRO_MONTHLY" | "PRO_YEARLY";
    label?: string;
    description?: string;
};

export function UpgradeButton({
    plan = "LIFETIME",
    label,
    description = "Lifetime Premium Plan",
}: UpgradeButtonProps) {
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
                body: JSON.stringify({ plan }),
            });

            const orderData = await orderRes.json().catch(() => null);

            if (!orderRes.ok) {
                toast.error(orderData?.error || "Failed to create order");
                setLoading(false);
                return;
            }

            if (!window.Razorpay) {
                toast.error("Razorpay SDK failed to load. Please refresh and try again.");
                setLoading(false);
                return;
            }
            const options = {
                key: orderData.data.key,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: "Filego",
                description,
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
                            toast.error(verifyData?.error || "Payment verification failed");
                            return;
                        }
                        toast.success("Premium activated successfully");
                        router.refresh();
                    } catch (error) {
                        console.error("verify payment error", error);
                        toast.error("Payment completed, but verification failed. Please contact support.");
                    } finally {
                        setLoading(false);
                    }
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", function () {
                toast.error("Payment failed. Please try again.");
                setLoading(false);
            });

            razorpay.open();
        } catch (error) {
            console.error("upgrade error", error);
            toast.error("Something went wrong");
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
            {loading ? "Processing..." : label ?? "Upgrade now"}
        </Button>
    );
}