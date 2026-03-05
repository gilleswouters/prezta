// src/components/emails/WelcomeEmail.ts

export const WelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: 800; color: #2563EB; text-decoration: none; }
        .content { margin-bottom: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563EB; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { font-size: 12px; color: #888; text-align: center; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://prezta.com" class="logo">Prezta</a>
        </div>
        <div class="content">
            <h1>Bienvenue parmi nous, ${name} ! 🚀</h1>
            <p>Nous sommes ravis de vous compter parmi les utilisateurs de <strong>Prezta</strong>.</p>
            <p>L'aventure commence ici. Vous pouvez dès maintenant :</p>
            <ul>
                <li>Créer votre catalogue de prestations</li>
                <li>Ajouter vos premiers clients</li>
                <li>Générer des devis et factures professionnels</li>
            </ul>
            <p style="margin-top: 30px;">
                <a href="https://prezta.com/dashboard" class="button">Accéder à mon tableau de bord</a>
            </p>
            <p>Si vous avez des questions, notre équipe est là pour vous aider.</p>
        </div>
        <div class="footer">
            &copy; 2026 Prezta. Tous droits réservés.<br>
            Ceci est un email transactionnel envoyé par Prezta.
        </div>
    </div>
</body>
</html>
`;
