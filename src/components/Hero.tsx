
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-accent/10 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Eng zo'r <span className="text-primary">Somsa</span> shaharda!
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
            An'anaviy retseptlar bo'yicha tayyorlangan yangi, issiq va ajoyib mazali somsa.
            Biz eng yaxshi ingredientlarni tanlab, sevgi bilan pishiramiz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="font-medium">
              Hoziroq buyurtma bering
              </Button>
              <Button size="lg" variant="outline" className="font-medium">
              Bizning menyu
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Somsa turlari</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">30</div>
                <div className="text-sm text-muted-foreground">Bir necha daqiqada yetkazib berish</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5000+</div>
                <div className="text-sm text-muted-foreground">Qoniqarli mijozlar</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10 rounded-lg overflow-hidden shadow-xl">
              <img 
                src="/special-somsa.jpg" 
                alt="Denov Baraka Somsa" 
                className="w-full h-auto object-cover" 
              />
            </div>
            <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 transform -translate-x-1/2 translate-y-1/4 w-60 h-60 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-primary/5 to-transparent" />
    </div>
  );
};

export default Hero;
