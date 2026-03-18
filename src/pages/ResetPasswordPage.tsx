import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères'),
    confirm: z.string(),
}).refine(d => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
})

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
    })

    const onSubmit = async (data: ResetFormValues) => {
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password: data.password })
        setLoading(false)

        if (error) {
            toast.error(error.message)
            return
        }

        toast.success('Mot de passe mis à jour avec succès !')
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-serif text-text">
                    Nouveau mot de passe
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="bg-surface border-border">
                    <CardHeader>
                        <CardTitle className="text-text">Choisir un nouveau mot de passe</CardTitle>
                        <CardDescription className="text-text-muted">
                            Votre nouveau mot de passe doit comporter au moins 8 caractères.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <Label htmlFor="password" className="text-text">Nouveau mot de passe</Label>
                                <div className="mt-1">
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        {...register('password')}
                                        className="bg-surface2 border-border text-text"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirm" className="text-text">Confirmer le mot de passe</Label>
                                <div className="mt-1">
                                    <Input
                                        id="confirm"
                                        type="password"
                                        autoComplete="new-password"
                                        {...register('confirm')}
                                        className="bg-surface2 border-border text-text"
                                    />
                                    {errors.confirm && (
                                        <p className="mt-1 text-sm text-red-500">{errors.confirm.message}</p>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-accent text-bg hover:opacity-90">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mettre à jour le mot de passe
                            </Button>
                        </form>
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
