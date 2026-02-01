import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useGeneralStore } from "@/hooks/use-general-store";
import { SectionHeader } from "./section-header";

export function GeneralSettings() {
    const { openInNewTab, showFavicons, updateSettings } = useGeneralStore();

    return (
        <>
            <SectionHeader
                title="General"
                description="Configure general application settings."
            />

            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Open links in new tab</Label>
                        <p className="text-sm text-muted-foreground">
                            Always open bookmarks in a new browser tab.
                        </p>
                    </div>
                    <Switch
                        checked={openInNewTab}
                        onCheckedChange={(checked) =>
                            updateSettings({ openInNewTab: checked })
                        }
                    />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Show favicons</Label>
                        <p className="text-sm text-muted-foreground">
                            Display website icons next to bookmark titles.
                        </p>
                    </div>
                    <Switch
                        checked={showFavicons}
                        onCheckedChange={(checked) =>
                            updateSettings({ showFavicons: checked })
                        }
                    />
                </div>
            </div>
        </>
    );
}
