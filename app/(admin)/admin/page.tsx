import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
    const session = await requireAdmin();

    return (
        <main className="container mx-auto px-4 py-16">
            <h1 className="text-3xl font-semibold tracking-tight">Admin panel</h1>
            <p className="mt-3 text-muted-foreground">
                Welcome admin {session.user.name || session.user.email}
            </p>

            <div className="mt-6 rounded-2xl border p-6">
                <p className="text-sm">Role: {session.user.role}</p>
                <p className="text-sm">You can place admin-only tools here.</p>
            </div>
        </main>
    );
}