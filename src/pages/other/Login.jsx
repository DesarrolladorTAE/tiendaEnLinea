import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';

const LoginOverlayMui = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [activeForm, setActiveForm] = useState('login');


  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e, isLogin = true) => {
    const { name, value } = e.target;
    if (isLogin) {
      setLoginData({ ...loginData, [name]: value });
    } else {
      setRegisterData({ ...registerData, [name]: value });
    }
  };

  const handleLogin = () => {
    console.log('Login', loginData);
  };

  const handleRegister = () => {
    console.log('Register', registerData);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f6f5f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1100,
          height: 650,
          position: 'relative',
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow: 5,
        }}
      >
        {/* Contenedor de formularios (no se mueve) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            zIndex: 1,
          }}
        >
          {/* Login */}
          <Box
            sx={{
              width: '50%',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
            }}
          >
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Iniciar Sesión
            </Typography>
            <TextField
              label="Teléfono"
              name="phone"
              fullWidth
              value={loginData.phone}
              onChange={(e) => handleChange(e, true)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              fullWidth
              value={loginData.password}
              onChange={(e) => handleChange(e, true)}
              sx={{ mb: 2 }}
            />
            <Button
              sx={{
                width: '50%',
                backgroundColor: '#00bfff',
                color: 'white',
                borderRadius: '25px',
                mt: 2,
                '&:hover': { backgroundColor: '#009edb' },
              }}
              onClick={handleLogin}
            >
              INICIAR SESIÓN
            </Button>
          </Box>

          {/* Registro */}
          <Box
            sx={{
              width: '50%',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
            }}
          >
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Crea tu Cuenta
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <TextField
                label="Nombre"
                name="name"
                fullWidth
                value={registerData.name}
                onChange={(e) => handleChange(e, false)}
                sx={{ backgroundColor: '#f1f1f1' }}
              />
              <TextField
                label="Apellidos"
                name="lastName"
                fullWidth
                value={registerData.lastName}
                onChange={(e) => handleChange(e, false)}
                sx={{ backgroundColor: '#f1f1f1' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
              <TextField
                label="Correo electrónico"
                name="email"
                fullWidth
                value={registerData.email}
                onChange={(e) => handleChange(e, false)}
                sx={{ backgroundColor: '#f1f1f1' }}
              />
              <TextField
                label="Teléfono"
                name="phone"
                fullWidth
                value={registerData.phone}
                onChange={(e) => handleChange(e, false)}
                sx={{ backgroundColor: '#f1f1f1' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                fullWidth
                value={registerData.password}
                onChange={(e) => handleChange(e, false)}
                sx={{ backgroundColor: '#f1f1f1' }}
              />
              <TextField
                label="Confirmar Contraseña"
                name="password_confirmation"
                type="password"
                fullWidth
                value={registerData.password_confirmation}
                onChange={(e) => handleChange(e, false)}
                sx={{ backgroundColor: '#f1f1f1' }}
              />
            </Box>

            <Button
              sx={{
                width: '60%',
                backgroundColor: '#be4bdb',
                color: 'white',
                borderRadius: '25px',
                mt: 3,
                '&:hover': { backgroundColor: '#a638bd' },
              }}
              onClick={handleRegister}
            >
              REGISTRARME
            </Button>
          </Box>
        </Box>

        {isMobile && (
          <Box
            sx={{
              height: '200px',
              width: '100%',
              background: 'linear-gradient(to right, #be4bdb, #00bfff)',
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              textAlign: 'center',
              px: 3,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {activeForm === 'login' ? '¡Bienvenido de vuelta!' : '¡Únete ahora!'}
              </Typography>
              <Typography variant="body2" mt={1}>
                {activeForm === 'login'
                  ? 'Inicia sesión para continuar'
                  : 'Crea una cuenta gratis en segundos'}
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  mt: 2,
                  borderColor: '#fff',
                  color: '#fff',
                  borderRadius: '25px',
                  '&:hover': {
                    backgroundColor: '#fff',
                    color: '#be4bdb',
                  },
                }}
                onClick={() =>
                  setActiveForm((prev) => (prev === 'login' ? 'register' : 'login'))
                }
              >
                {activeForm === 'login' ? 'Registrarme' : 'Iniciar Sesión'}
              </Button>
            </Box>
          </Box>
        )}

        Overlay con efecto deslizante
        {!isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: rightPanelActive ? '0%' : '50%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(to right, #be4bdb, #00bfff)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'left 0.6s ease-in-out',
              zIndex: 5,
              borderTopLeftRadius: rightPanelActive ? 0 : 40,
              borderBottomLeftRadius: rightPanelActive ? 0 : 40,
              borderTopRightRadius: rightPanelActive ? 40 : 0,
              borderBottomRightRadius: rightPanelActive ? 40 : 0,
            }}
          >
            <Box textAlign="center" px={4}>
              <Typography variant="h5" fontWeight="bold">
                {rightPanelActive ? '¡Bienvenido!' : 'Hola!'}
              </Typography>
              <Typography sx={{ mt: 1, mb: 2 }}>
                {rightPanelActive
                  ? 'Inicia sesión con tu cuenta'
                  : 'Crea tu cuenta para comenzar tu experiencia'}
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  color: '#fff',
                  borderColor: '#fff',
                  borderRadius: '25px',
                  px: 4,
                  '&:hover': { backgroundColor: '#fff', color: '#be4bdb' },
                }}
                onClick={() => setRightPanelActive(!rightPanelActive)}
              >
                {rightPanelActive ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LoginOverlayMui;
