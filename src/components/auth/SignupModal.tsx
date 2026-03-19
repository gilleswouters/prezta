import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendEmail } from '@/lib/resend';
import { WelcomeEmailTemplate } from '@/components/emails/WelcomeEmail';

const signupSchema = z.object({
    email: z.string().email({ message: 'Adresse email invalide' }),
    password: z.string().min(8, { message: 'Le mot de passe doit faire au moins 8 caractères' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupModalProps {
    open: boolean;
    onClose: () => void;
}

export function SignupModal({ open, onClose }: SignupModalProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) onClose();
    };

    const onSubmit = async (data: SignupFormValues) => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        sendEmail({
            to: data.email,
            subject: 'Bienvenue sur Prezta ! 🚀',
            html: WelcomeEmailTemplate(data.email.split('@')[0]),
        });

        toast.success('Compte créé ! Bienvenue sur Prezta.');
        reset();
        onClose();
        navigate('/onboarding');
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-xl p-8 gap-0">

                {/* Wordmark */}
                <p className="text-2xl font-black text-brand text-center tracking-tight mb-1">
                    Prezta
                </p>
                <h2 className="text-xl font-bold text-text-primary text-center mb-6">
                    Créer votre compte
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-sm font-semibold text-text-primary">
                            Adresse email
                        </Label>
                        <Input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            placeholder="vous@exemple.fr"
                            {...register('email')}
                            className="border-border bg-white h-10"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-sm font-semibold text-text-primary">
                            Mot de passe
                        </Label>
                        <Input
                            id="signup-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="8 caractères minimum"
                            {...register('password')}
                            className="border-border bg-white h-10"
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand hover:bg-brand-hover text-white font-semibold h-11 rounded-lg mt-1"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        S'inscrire
                    </Button>
                </form>

                <p className="text-sm text-text-muted text-center mt-5">
                    Déjà un compte ?{' '}
                    <Link
                        to="/login"
                        onClick={onClose}
                        className="text-brand font-semibold hover:underline"
                    >
                        Se connecter
                    </Link>
                </p>
            </DialogContent>
        </Dialog>
    );
}
