import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/therapy";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, User } from "lucide-react";

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    onUpdate: (updates: { name: string; age: number }) => Promise<{ error: any }>;
    onDelete: () => Promise<{ error: any }>;
}

export function ProfileSettings({
    isOpen,
    onClose,
    userProfile,
    onUpdate,
    onDelete,
}: ProfileSettingsProps) {
    const [name, setName] = useState(userProfile?.name || "");
    const [age, setAge] = useState(userProfile?.age?.toString() || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!name.trim()) {
            toast({
                title: "Error",
                description: "El nombre no puede estar vacío.",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        const { error } = await onUpdate({
            name: name.trim(),
            age: parseInt(age) || 0
        });

        setIsUpdating(false);
        if (error) {
            toast({
                title: "Error al actualizar",
                description: "No se pudieron guardar los cambios.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Perfil actualizado",
                description: "Tus datos se han guardado correctamente.",
            });
            onClose();
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const { error } = await onDelete();
        setIsDeleting(false);

        if (error) {
            toast({
                title: "Error al eliminar",
                description: "No se pudo eliminar la cuenta en este momento.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                {!showDeleteConfirm ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Configuración de Perfil
                            </DialogTitle>
                            <DialogDescription>
                                Actualiza tu información personal para personalizar tu experiencia.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="age">Edad (opcional)</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="Tu edad"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium text-destructive">Zona de Peligro</h4>
                                    <p className="text-xs text-muted-foreground">Elimina permanentemente tus datos.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar Cuenta
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button variant="ghost" onClick={onClose} disabled={isUpdating}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar cambios
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-destructive">¿Estás absolutamente seguro?</DialogTitle>
                            <DialogDescription>
                                Esta acción no se puede deshacer. Se eliminarán permanentemente tus conversaciones, análisis y todo tu progreso.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Trash2 className="h-8 w-8 text-destructive" />
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                                Volver atrás
                            </Button>
                            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sí, eliminar todo
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
