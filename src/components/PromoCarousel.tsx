import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Percent, Tag, TrendingDown } from "lucide-react";

const promoSlides = [
  {
    icon: Percent,
    title: "20% OFF na primeira compra",
    description: "Use o cupom BEMVINDO20 no checkout",
    bgGradient: "from-primary to-primary/70",
  },
  {
    icon: Tag,
    title: "Ofertas imperdíveis",
    description: "Produtos selecionados com até 40% de desconto",
    bgGradient: "from-secondary to-secondary/70",
  },
  {
    icon: TrendingDown,
    title: "Melhores preços",
    description: "Qualidade garantida com preços que cabem no bolso",
    bgGradient: "from-accent to-accent/70",
  },
];

export const PromoCarousel = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Carousel 
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {promoSlides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <CarouselItem key={index}>
                <Card className={`relative overflow-hidden border-0 bg-gradient-to-r ${slide.bgGradient}`}>
                  <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {slide.title}
                    </h3>
                    <p className="text-white/90 text-sm md:text-base max-w-md">
                      {slide.description}
                    </p>
                    {index === 0 && (
                      <Badge 
                        variant="secondary" 
                        className="mt-4 bg-white text-primary font-semibold text-sm px-4 py-2"
                      >
                        BEMVINDO20
                      </Badge>
                    )}
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
};
