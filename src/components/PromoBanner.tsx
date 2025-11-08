import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PromoBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const bannerClosed = localStorage.getItem("promoBannerClosed");
    if (bannerClosed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("promoBannerClosed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 text-center">
            <p className="text-sm md:text-base font-medium">
              🎉 <span className="font-bold">OFERTA ESPECIAL:</span> 20% OFF na primeira compra! Use o cupom: <span className="font-bold bg-primary-foreground/20 px-2 py-1 rounded">PRIMEIRA20</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
            aria-label="Fechar banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
