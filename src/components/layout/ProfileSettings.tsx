import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/therapy";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, User, Code, RotateCcw } from "lucide-react";

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    onUpdate: (updates: { name: string; age: number }) => Promise<{ error: any }>;
    onDelete: () => Promise<{ error: any }>;
    onFullReset?: () => Promise<void>;
}

export function ProfileSettings({
    isOpen,
    onClose,
    userProfile,
    onUpdate,
    onDelete,
    onFullReset,
}: ProfileSettingsProps) {
    const [name, setName] = useState(userProfile?.name || "");
    const [age, setAge] = useState(userProfile?.age?.toString() || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const { toast } = useToast();

    const isModerator = userProfile?.is_moderator ?? false;

    useEffect(() => {
        if (isOpen && userProfile) {
            setName(userProfile.name || "");
            setAge(userProfile.age?.toString() || "");
        }
        if (isOpen) {
            setShowDeleteConfirm(false);
            setShowResetConfirm(false);
        }
    }, [isOpen, userProfile]);

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
        } else {
            onClose();
        }
    };

    const handleFullReset = async () => {
        if (!onFullReset) return;
        setIsResetting(true);
        await onFullReset();
        setIsResetting(false);
        setShowResetConfirm(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                {showDeleteConfirm ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-destructive">¿Estás absolutamente seguro?</DialogTitle>
                            <DialogDescription>
                                Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta, conversaciones, análisis y todo tu progreso.
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
                ) : showResetConfirm ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-orange-500">Confirmar Reset Completo</DialogTitle>
                            <DialogDescription>
                                Se borrarán TODOS los mensajes, análisis emocionales, sugerencias, logros y rachas. La cuenta se mantiene pero empieza de cero.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <RotateCcw className="h-8 w-8 text-orange-500" />
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowResetConfirm(false)} disabled={isResetting}>
                                Cancelar
                            </Button>
                            <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleFullReset} disabled={isResetting}>
                                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sí, borrar todo y empezar de cero
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
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

                        {isModerator && (
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <Code className="h-4 w-4 text-orange-500" />
                                    <h4 className="text-sm font-semibold text-orange-500">Modo Desarrollador</h4>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Herramientas de desarrollo. Borra todos los datos para probar la app desde cero.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                                    onClick={() => setShowResetConfirm(true)}
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Borrar todo y empezar de cero
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-border flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium text-destructive">Zona de Peligro</h4>
                                    <p className="text-xs text-muted-foreground">Elimina permanentemente tu cuenta.</p>
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
                )}
            </DialogContent>
        </Dialog>
    );
}
