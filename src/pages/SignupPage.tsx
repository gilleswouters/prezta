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

const signupSchema = z.object({
    email: z.string().email({ message: "Adresse email invalide" }),
    password: z.string().min(6, { message: "Le mot de passe doit faire au moins 6 caractères" }),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    })

    const onSubmit = async (data: SignupFormValues) => {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success("Inscription réussie. Vérifiez vos emails pour confirmer votre compte.")
            navigate('/login')
        }
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-serif text-text">
                    Rejoignez <span className="text-accent italic">Prezta</span>
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="bg-surface border-border">
                    <CardHeader>
                        <CardTitle className="text-text">Créer un compte</CardTitle>
                        <CardDescription className="text-muted">Commencez à gérer votre activité freelance dès aujourd'hui.</CardDescription>
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
                                        autoComplete="new-password"
                                        {...register('password')}
                                        className="bg-surface2 border-border text-text"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                                </div>
                            </div>

                            <div>
                                <Button type="submit" disabled={loading} className="w-full bg-accent text-bg hover:opacity-90">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    S'inscrire
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted">
                            Déjà un compte ?{' '}
                            <Link to="/login" className="font-medium text-accent hover:text-p1">
                                Se connecter
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
