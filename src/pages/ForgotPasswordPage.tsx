import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

const resetSchema = z.object({
    email: z.string().email({ message: "Adresse email invalide" }),
})

type ResetFormValues = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
    })

    const onSubmit = async (data: ResetFormValues) => {
        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            setIsSent(true)
            toast.success("Instructions envoyées à votre adresse email.")
        }
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-serif text-text">
                    Réinitialisation
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="bg-surface border-border">
                    <CardHeader>
                        <CardTitle className="text-text">Mot de passe oublié</CardTitle>
                        <CardDescription className="text-text-muted">Entrez votre adresse email pour recevoir un lien de réinitialisation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSent ? (
                            <div className="text-center py-4 text-p1">
                                <p>Un email de réinitialisation a été envoyé si l'adresse est associée à un compte.</p>
                            </div>
                        ) : (
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
                                    <Button type="submit" disabled={loading} className="w-full bg-accent text-bg hover:opacity-90">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Générer un lien
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link to="/login" className="flex items-center font-medium text-accent hover:text-p1 text-sm">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Retour à la connexion
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
