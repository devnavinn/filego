"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { invalidatePlan } from "@/hooks/use-plan";
import { PRO_PASSES, type PassKey } from "@/lib/plans";
import { CREDIT_PACKS, type CreditPackKey } from "@/lib/photo-credits";
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
    /** Buy a Pro pass... */
    plan?: PassKey;
    /** ...or an AI Photo Editor credit pack. */
    pack?: CreditPackKey;
    /** Called after the payment is verified. */
    onSuccess?: () => void;
    /** The currency the page showed, so the server can catch a stale price. */
    currency?: string;
    label?: string;
    className?: string;
};

export function UpgradeButton({
    plan,
    pack,
    onSuccess,
    currency,
    label,
    className,
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
                body: JSON.stringify(pack ? { pack, currency } : { plan, currency }),
            });

            const orderData = await orderRes.json().catch(() => null);

            if (!orderRes.ok) {
                toast.error(orderData?.error || "Failed to create order");
                setLoading(false);
                if (orderData?.code === "PRICE_CHANGED") router.refresh();
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
                description: pack ? `Filego AI Photo Editor: ${CREDIT_PACKS[pack].name}` : `Filego ${PRO_PASSES[plan ?? "PRO_MONTHLY"].name}`,
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
                        if (pack) {
                            toast.success(`${CREDIT_PACKS[pack].credits} photo edits added. Thanks for your purchase!`);
                        } else {
                            invalidatePlan();
                            toast.success("Filego Pro is active. Thanks for upgrading!");
                        }
                        onSuccess?.();
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
            className={className ?? "rounded-xl bg-primary text-primary-foreground hover:opacity-90"}
        >
            {loading ? "Processing..." : label ?? "Upgrade now"}
        </Button>
    );
}