import React from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, UserGroupIcon, NutritionIcon } from '../components/icons/Icons';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { AnimatedWrapper, SplitText } from '../components/Animated';
import ThemeToggle from '../components/ThemeToggle';

const LandingHeader = () => {
  return (
    <header className="sticky top-0 z-40 bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm border-b border-border dark:border-dark-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <CubeIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground dark:text-dark-foreground">
            La Gran Familia
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button as={Link} to="/login">
            Entrar a la App
          </Button>
        </div>
      </div>
    </header>
  );
};

const Section: React.FC<{
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, title, children, className }) => (
  <section id={id} className={`py-16 md:py-24 ${className}`}>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <AnimatedWrapper delay={0.1}>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          <SplitText text={title} />
        </h2>
        {children}
      </AnimatedWrapper>
    </div>
  </section>
);

const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}> = ({ icon: Icon, title, description, delay }) => (
  <AnimatedWrapper delay={delay}>
    <Card className="text-center h-full hover:shadow-medium transition-shadow duration-300 hover:-translate-y-1">
      <CardHeader className="items-center">
        <div className="bg-primary/10 text-primary rounded-lg p-3 mb-4 flex flex-col items-center">
          <Icon className="w-8 h-8 mb-2" />
          <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </AnimatedWrapper>
);

const Landing: React.FC = () => {
  return (
    <div className="bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground">
      <LandingHeader />
      <main>
        {/* Hero Section */}
        <section className="relative py-24 md:py-40 text-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--hero-gradient-start),_var(--hero-gradient-end))]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <AnimatedWrapper>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground dark:text-dark-foreground">
                <SplitText text={'Gestión de Inventario'} />{' '}
                <span className="text-primary">
                  <SplitText text="La Gran Familia" />
                </span>
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground dark:text-dark-muted-foreground">
                Gestionando eficientemente los recursos para apoyar nuestra misión de brindar
                cuidado y construir futuros más brillantes.
              </p>
              <div className="mt-10 flex justify-center">
                <Button
                  as={Link}
                  to="/login"
                  size="lg"
                  className="shadow-elegant hover:shadow-glow transition-shadow duration-300"
                >
                  Entrar al Sistema de Inventario
                </Button>
              </div>
            </AnimatedWrapper>
          </div>
        </section>

        {/* Core Features */}
        <Section
          id="features"
          title={'Características Principales'}
          className="bg-muted dark:bg-dark-muted"
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={CubeIcon}
              title={'Control de Inventario'}
              description={
                'Rastrea productos, administra lotes de stock en múltiples almacenes y monitorea fechas de caducidad con reportes detallados.'
              }
              delay={0.2}
            />
            <FeatureCard
              icon={NutritionIcon}
              title={'Planeación Nutricional'}
              description={
                'Un módulo dedicado para que los nutricionistas planeen menús diarios y el personal de cocina solicite ingredientes según los niveles de stock.'
              }
              delay={0.3}
            />
            <FeatureCard
              icon={UserGroupIcon}
              title={'Gestión de Donantes'}
              description={
                'Registra donaciones, administra una lista completa de donantes y obtén información valiosa con potentes análisis.'
              }
              delay={0.4}
            />
          </div>
        </Section>

        {/* About Us Section */}
        <Section id="about-us" title={'Sobre La Gran Familia'}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12 items-center">
            <div className="md:col-span-1">
              <Card className="bg-transparent border-none shadow-none">
                <CardContent className="space-y-4 text-muted-foreground text-base leading-relaxed p-0">
                  <p>
                    Fundada en la década de 1980, <strong>La Gran Familia</strong> brinda un santuario residencial para menores que han carecido de protección familiar. Nuestro objetivo es proporcionar un ambiente inspirado en valores familiares, encendiendo la esperanza y preparándolos para un futuro en un entorno familiar amoroso.
                  </p>
                  <p>
                    Visualizamos un mundo donde todos los niños, niñas y adolescentes estén integrados en familias que promuevan su desarrollo integral, permitiéndoles formar sus propias familias armoniosas.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card className="border-l-4 border-primary">
                <CardHeader>
                  <CardTitle>Nuestra Fundación</CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="italic text-muted-foreground">
                    "Asegurar que ningún niño quede en la calle, ayudándolos a sanar y prepararse para una vida dentro de una familia amorosa."
                  </blockquote>
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer
        id="contacto"
        className="bg-card dark:bg-dark-card border-t border-border dark:border-dark-border"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-4">Casa Paterna La Gran Familia</h3>
            <address className="not-italic space-y-2 text-muted-foreground">
              <p>Carretera Nacional km 225, Los Rodríguez, Santiago, N.L.</p>
              <p>8266 0060 / 8266 0061 | informacion@lagranfamilia.org.mx</p>
            </address>
          </div>
          <div className="text-center mt-10 border-t border-border dark:border-dark-border pt-6 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} La Gran Familia. Todos los Derechos Reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
