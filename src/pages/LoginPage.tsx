import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
    email: z.string().email({ message: "Adresse email invalide" }),
    password: z.string().min(6, { message: "Le mot de passe doit faire au moins 6 caractères" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [magicLinkLoading, setMagicLinkLoading] = useState(false)

    const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const emailValue = watch('email')

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })

        if (error) {
            toast.error(error.message === 'Invalid login credentials' ? 'Identifiants invalides.' : error.message)
            setLoading(false)
        } else {
            toast.success('Connexion réussie')
            navigate('/')
        }
    }

    const handleMagicLink = async () => {
        if (!emailValue || errors.email) {
            toast.error("Veuillez entrer une adresse email valide.")
            return
        }
        setMagicLinkLoading(true)
        const { error } = await supabase.auth.signInWithOtp({
            email: emailValue,
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Lien magique envoyé. Vérifiez vos emails.")
        }
        setMagicLinkLoading(false)
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-serif text-text">
                    Bienvenue sur <span className="text-accent italic">Prezta</span>
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="bg-surface border-border">
                    <CardHeader>
                        <CardTitle className="text-text">Connexion</CardTitle>
                        <CardDescription className="text-muted">Accédez à votre espace workspace freelance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <Label htmlFor="email" className="text-text">Adresse email</Label>
                                <div className="mt-1">
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        {...register('email')}
                                        className="bg-surface2 border-border text-text"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-text">Mot de passe</Label>
                                <div className="mt-1">
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        {...register('password')}
                                        className="bg-surface2 border-border text-text"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <Link to="/forgot-password" className="font-medium text-accent hover:text-p1">
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <Button type="submit" disabled={loading || magicLinkLoading} className="w-full bg-accent text-bg hover:opacity-90">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Se connecter
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-surface px-2 text-muted">Ou continuez avec</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button
                                    onClick={handleMagicLink}
                                    disabled={magicLinkLoading || loading}
                                    variant="outline"
                                    className="w-full border-border text-text hover:bg-surface2"
                                >
                                    {magicLinkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Recevoir un lien magique (Magic Link)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted">
                            Pas encore de compte ?{' '}
                            <Link to="/signup" className="font-medium text-accent hover:text-p1">
                                S'inscrire
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
