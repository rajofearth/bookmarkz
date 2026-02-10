"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Cropper,
    CropperArea,
    type CropperAreaData,
    CropperImage,
    type CropperPoint,
} from "@/components/ui/cropper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

async function createCroppedImage(
    imageSrc: string,
    cropData: CropperAreaData,
    fileName: string,
): Promise<File> {
    const image = new Image();
    image.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
        image.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            canvas.width = cropData.width;
            canvas.height = cropData.height;

            ctx.drawImage(
                image,
                cropData.x,
                cropData.y,
                cropData.width,
                cropData.height,
                0,
                0,
                cropData.width,
                cropData.height,
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Canvas is empty"));
                    return;
                }

                const croppedFile = new File([blob], `cropped-${fileName}`, {
                    type: "image/png",
                });
                resolve(croppedFile);
            }, "image/png");
        };

        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = imageSrc;
    });
}

interface ProfileImageUploadProps {
    currentAvatar?: string;
    onImageChange?: (file: File) => void;
    fallbackText?: string;
}

export function ProfileImageUpload({
    currentAvatar,
    onImageChange,
    fallbackText = "JD",
}: ProfileImageUploadProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [crop, setCrop] = React.useState<CropperPoint>({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [croppedArea, setCroppedArea] = React.useState<CropperAreaData | null>(
        null,
    );
    const [showCropDialog, setShowCropDialog] = React.useState(false);

    const selectedImageUrl = React.useMemo(() => {
        if (!selectedFile) return null;
        return URL.createObjectURL(selectedFile);
    }, [selectedFile]);

    React.useEffect(() => {
        return () => {
            if (selectedImageUrl) {
                URL.revokeObjectURL(selectedImageUrl);
            }
        };
    }, [selectedImageUrl]);

    const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedArea(null);
            setShowCropDialog(true);
            // Reset input so the same file can be selected again
            event.target.value = "";
        }
    };

    const onCropComplete = (
        _: unknown,
        croppedAreaPixels: CropperAreaData,
    ) => {
        setCroppedArea(croppedAreaPixels);
    };

    const onCropApply = async () => {
        if (!selectedFile || !croppedArea || !selectedImageUrl) return;

        try {
            const croppedFile = await createCroppedImage(
                selectedImageUrl,
                croppedArea,
                selectedFile.name,
            );

            onImageChange?.(croppedFile);
            setShowCropDialog(false);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to crop image",
            );
        }
    };

    const onCropDialogOpenChange = (open: boolean) => {
        setShowCropDialog(open);
        if (!open) {
            setSelectedFile(null);
        }
    };

    return (
        <>
            <div className="relative group shrink-0">
                <Avatar className="size-32 border-4 border-sidebar-border/50">
                    <AvatarImage src={currentAvatar} />
                    <AvatarFallback className="text-4xl bg-sidebar-accent text-sidebar-accent-foreground">
                        {fallbackText}
                    </AvatarFallback>
                </Avatar>
                <div
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="text-white size-8" />
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={onFileSelect}
                />
            </div>

            <Dialog open={showCropDialog} onOpenChange={onCropDialogOpenChange}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Crop Profile Image</DialogTitle>
                        <DialogDescription>
                            Adjust your profile picture below.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedFile && selectedImageUrl && (
                        <div className="flex flex-col gap-4">
                            <Cropper
                                aspectRatio={1}
                                shape="circle"
                                crop={crop}
                                onCropChange={setCrop}
                                zoom={zoom}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                className="h-96 w-full rounded-md border"
                            >
                                <CropperImage
                                    src={selectedImageUrl}
                                    alt="Crop preview"
                                    crossOrigin="anonymous"
                                />
                                <CropperArea />
                            </Cropper>
                            <div className="flex flex-col gap-2">
                                <Label className="text-sm">Zoom: {zoom.toFixed(2)}</Label>
                                <Slider
                                    value={[zoom]}
                                    onValueChange={(value) => setZoom(value[0] ?? 1)}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={() => setShowCropDialog(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button onClick={onCropApply} disabled={!croppedArea}>
                            Save Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
