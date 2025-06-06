import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Box,
  TextField,
  Paper,
  InputAdornment,
  Link,
  Divider,
} from "@mui/material";
import {
  ArrowUpward,
  RocketLaunch,
  Security,
  FlashOn,
  SupportAgent,
  ChevronRight,
  Mail,
  Phone,
  LocationOn,
  ShoppingBag,
  TrendingUp,
  Inventory2,
  Public,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function LandingMuiBootstrap() {
  const navigate = useNavigate();
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 64; // Ajuste de la altura de la barra de navegación
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    {
      title: "Desarrollo Web",
      description:
        "Creamos sitios web modernos, rápidos y optimizados para convertir visitantes en clientes.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      price: "Desde $999",
      features: ["Diseño Responsivo", "SEO Optimizado", "Carga Rápida"],
    },
    {
      title: "Marketing Digital",
      description: "Estrategias integrales para aumentar tu presencia online y generar más ventas.",
      image:
        "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      price: "Desde $599",
      features: ["Redes Sociales", "Google Ads", "Email Marketing"],
    },
    {
      title: "Consultoría",
      description:
        "Análisis personalizado para optimizar tus procesos y maximizar tu rentabilidad.",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      price: "Desde $299",
      features: ["Análisis de Negocio", "Estrategia", "Implementación"],
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Optimiza tus Puntos de Venta",
      items: [
        "Accede a reportes inteligentes para maximizar tus ventas",
        "Supervisa tus operaciones en tiempo real",
        "Administra múltiples sucursales de manera centralizada",
      ],
      bgClass: "bg-primary",
    },
    {
      icon: Inventory2,
      title: "Control Inteligente de Inventarios",
      items: [
        "Gestiona entradas, salidas y movimientos de productos automáticamente",
        "Recibe alertas para reabastecer tu stock antes de que se agote",
        "Optimiza la rotación de productos para aumentar tus ganancias",
        "Accede a reportes detallados para tomar decisiones estratégicas",
      ],
      bgClass: "bg-danger",
    },
    {
      icon: Public,
      title: "Expande tus Ventas en Línea",
      items: [
        "Publica y actualiza tus productos de forma sencilla",
        "Llega a clientes nuevos en todo el mundo",
        "Multiplica tus ingresos a través de canales digitales",
      ],
      bgClass: "bg-success",
    },
  ];

  return (
    <div className="bg-light">
      {/* Navbar */}
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar className="d-flex justify-content-between">
          <img
            src="/assets/logoc.png"
            alt="Logo de mitiendaenlineamx"
            style={{ maxWidth: "250px", height: "auto" }}
          />
          <div className="d-none d-md-flex gap-3">
            {["inicio", "servicios", "contacto"].map((id) => (
              <Button key={id} onClick={() => scrollTo(id)} color="inherit">
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </Button>
            ))}
            <Button variant="contained" color="primary" onClick={() => navigate("/login-register")}>
              INICIAR SESIÓN
            </Button>
          </div>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <section id="inicio" className="bg-primary text-white py-5" style={{ marginTop: 64 }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h3" style={{ color: 'white' }}>
                Impulsa tu negocio con
                <br />
                <span className="text-warning">mitiendaenlineamx</span>
              </Typography>
              <Typography variant="body1" component="p" className="my-3">
                Una plataforma pensada para llevar la gestión de tu negocio o comercio al siguiente
                nivel.
              </Typography>
              <div className="d-flex gap-2">
                <Button variant="contained" style={{ backgroundColor: "#f9b233", color: "#000" }}>
                  Empezar Ahora
                </Button>
                <Button variant="outlined" color="inherit">
                  Ver Demo
                </Button>
              </div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardMedia
                  component="img"
                  image="https://images.unsplash.com/photo-1551434678-e076c223a692"
                  height="300"
                  alt="hero"
                />
              </Card>
            </Grid>
          </Grid>
        </Container>
      </section>

      {/* MITIENDAENLINEAMX Section */}
      <div className="py-5 bg-body text-light">
        <div className="container">
          {/* Hero Section */}
          <div className="text-center mb-5">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center p-4 rounded-circle bg-dark text-white shadow-lg"
                style={{
                  background: "linear-gradient(to right, #f9b233, #e94e1b)",
                }}
              >
                <ShoppingBag sx={{ fontSize: 48 }} />
              </div>
            </div>
            <h1 className="display-5 fw-bold bg-gradient text-primary">
              ¿Qué es MITIENDAENLINEAMX?
            </h1>
            <p className="lead mt-3" style={{ color: "#2c3e50" }}>
              <strong>MITIENDAENLINEAMX</strong> es tu aliado estratégico. Una plataforma poderosa
              que centraliza la gestión de tus ventas, inventarios y facturación, todo desde un solo
              lugar. <strong className="text-info">Fácil, rápido y seguro.</strong>
            </p>
          </div>

          {/* Features */}
          <div className="row">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 mb-4">
                <div className={`card h-100 border-0 text-light ${feature.bgClass}`}>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="d-inline-flex p-3 rounded bg-white bg-opacity-25">
                        <feature.icon sx={{ fontSize: 32, color: "#fff" }} />
                      </div>
                    </div>
                    <h5 className="card-title fw-bold">{feature.title}</h5>
                    <ul className="list-unstyled mt-3">
                      {feature.items.map((item, idx) => (
                        <li key={idx} className="d-flex align-items-start mb-2">
                          <div
                            className="me-2 mt-1 bg-white rounded-circle"
                            style={{ width: 8, height: 8 }}
                          ></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-5">
            <div
              className="card bg-gradient bg-primary bg-opacity-75 text-white border-0 p-4 mx-auto"
              style={{ maxWidth: "600px" }}
            >
              <h3 className="fw-bold mb-3">Transforma tu negocio hoy</h3>
              <p>Únete a miles de empresarios que ya confían en nuestra plataforma</p>
              <button className="btn btn-light btn-lg fw-bold px-5">Comenzar Ahora</button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-4 bg-body">
        <Container>
          <div className="text-center mb-4">
            <Typography variant="h4" gutterBottom>
              ¿Por qué elegirnos?
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Descubre las ventajas que nos hacen únicos en el mercado.
            </Typography>
          </div>
          <Grid container spacing={4}>
            {[
              {
                icon: <RocketLaunch color="primary" />,
                title: "Innovación Constante",
                text: "Tecnología de punta para destacar en el mercado.",
              },
              {
                icon: <Security color="primary" />,
                title: "Seguridad Garantizada",
                text: "Protegemos tus datos con los mejores estándares.",
              },
              {
                icon: <FlashOn color="primary" />,
                title: "Resultados Rápidos",
                text: "Soluciones eficientes en tiempo récord.",
              },
              {
                icon: <SupportAgent color="primary" />,
                title: "Soporte 24/7",
                text: "Siempre disponibles para ayudarte.",
              },
            ].map((f, idx) => (
              <Grid size={{ xs: 12, md: 3 }} key={idx}>
                <Card className="text-center h-100">
                  <CardContent>
                    <IconButton>{f.icon}</IconButton>
                    <Typography variant="h6" gutterBottom>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {f.text}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>
      {/* Services Section */}
      <section id="servicios" className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <Typography variant="h4" gutterBottom>
              Nuestros Servicios
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Soluciones completas para hacer crecer tu negocio
            </Typography>
          </div>
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card className="h-100">
                  <Box position="relative">
                    <CardMedia
                      component="img"
                      height="180"
                      image={service.image}
                      alt={service.title}
                    />
                    <Chip
                      label={service.price}
                      color="primary"
                      style={{ position: "absolute", top: 16, right: 16 }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {service.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {service.description}
                    </Typography>
                    <ul style={{ paddingLeft: 16 }}>
                      {service.features.map((f, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          <ChevronRight fontSize="small" style={{ verticalAlign: "middle" }} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="contained" color="primary" fullWidth>
                      Más Información
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>
      <section
        id="contacto"
        style={{
          background: "linear-gradient(to bottom right, #312e81, #6b21a8)",
          color: "#fff",
          padding: "3rem 0",
        }}
      >
        <Container>
          <div className="text-center mb-5">
            <Typography variant="h4" gutterBottom>
              ¿Listo para comenzar?
            </Typography>
            <Typography variant="body1" style={{ color: "#ddd" }}>
              Contáctanos hoy y descubre cómo podemos transformar tu negocio
            </Typography>
          </div>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Información de contacto
              </Typography>
              <Box mb={3} display="flex" alignItems="center">
                <Mail style={{ color: "#f9b233", marginRight: 16 }} />
                <Box>
                  <Typography color="#f9b233" fontWeight={600}>
                    Email
                  </Typography>
                  <Typography color="#ddd">contacto@tumarca.com</Typography>
                </Box>
              </Box>
              <Box mb={3} display="flex" alignItems="center">
                <Phone style={{ color: "#f9b233", marginRight: 16 }} />
                <Box>
                  <Typography color="#f9b233" fontWeight={600}>
                    Teléfono
                  </Typography>
                  <Typography color="#ddd">+52 (744) 218 8925</Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center">
                <LocationOn style={{ color: "#f9b233", marginRight: 16 }} />
                <Box>
                  <Typography color="#f9b233" fontWeight={600}>
                    Ubicación
                  </Typography>
                  <Typography color="#ddd">Ciudad de México, México</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={3}
                style={{
                  padding: "2rem",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "1rem",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Envíanos un mensaje
                </Typography>
                <form>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Nombre"
                        variant="outlined"
                        fullWidth
                        InputProps={{ style: { color: "#fff" } }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email"
                        type="email"
                        variant="outlined"
                        fullWidth
                        InputProps={{ style: { color: "#fff" } }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Asunto"
                        variant="outlined"
                        fullWidth
                        InputProps={{ style: { color: "#fff" } }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Mensaje"
                        multiline
                        rows={4}
                        variant="outlined"
                        fullWidth
                        InputProps={{ style: { color: "#fff" } }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        style={{ backgroundColor: "#f9b233", color: "#000" }}
                      >
                        Enviar Mensaje
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </section>
      <Box component="footer" bgcolor="#111827" color="#fff" py={8}>
        <Container>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}>
              <img
            src="/assets/logo3.png"
            alt="Logo de mitiendaenlineamx"
            style={{ maxWidth: "260px", height: "auto" }}
          />
              <Typography variant="body2" color="gray">
                Transformamos negocios con soluciones innovadoras y tecnología de vanguardia.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Servicios
              </Typography>
              {["Desarrollo Web", "Marketing Digital", "Consultoría", "Soporte Técnico"].map(
                (item, i) => (
                  <Typography key={i} variant="body2" color="gray">
                    <Link href="#" underline="hover" color="inherit">
                      {item}
                    </Link>
                  </Typography>
                )
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Empresa
              </Typography>
              {["Sobre Nosotros", "Equipo", "Carreras", "Blog"].map((item, i) => (
                <Typography key={i} variant="body2" color="gray">
                  <Link href="#" underline="hover" color="inherit">
                    {item}
                  </Link>
                </Typography>
              ))}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Legal
              </Typography>
              {["Privacidad", "Términos", "Cookies", "Contacto"].map((item, i) => (
                <Typography key={i} variant="body2" color="gray">
                  <Link href="#" underline="hover" color="inherit">
                    {item}
                  </Link>
                </Typography>
              ))}
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: "#1f2937" }} />
          <Typography variant="body2" align="center" color="gray">
            © 2025 TAE. Todos los derechos reservados.
          </Typography>
        </Container>
      </Box>
      {showScrollTop && (
        <IconButton
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="position-fixed bottom-0 end m-4 bg-primary text-white"
          size="large"
          style={{ zIndex: 9999 }}
        >
          <ArrowUpward />
        </IconButton>
      )}
    </div>
  );
}
