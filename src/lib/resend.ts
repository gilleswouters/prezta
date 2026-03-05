// src/lib/resend.ts

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!RESEND_API_KEY) {
        console.warn("VITE_RESEND_API_KEY is missing. Email skipped (logged to console).");
        console.log("--- MOCK EMAIL ---");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Body:", html);
        console.log("------------------");
        return { success: true, mock: true };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Prezta <onboarding@resend.dev>', // Default for testing
                to: [to],
                subject,
                html,
            }),
        });

        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        console.error("Resend API Error:", error);
        return { success: false, error };
    }
}
