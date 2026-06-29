import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Endpoint de Registro de Clientes (Soporta el registro en dos pasos de la app móvil)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, lastName, dni, address, district, phone } = req.body;

    if (!email || !password || !name || !lastName || !dni || !address || !district || !phone) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios para completar el registro.' });
    }

    // Verificar si el correo ya está registrado en Supabase
    const userExists = await prisma.usuarios.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }

    // Encriptar la contraseña mediante hashing seguro con BcryptJS (10 rondas de salt)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Generar identificadores UUID únicos para las entidades
    const usuarioId = crypto.randomUUID();
    const datosPersonalesId = crypto.randomUUID();
    const direccionId = crypto.randomUUID();

    // Crear usuario, datos personales y dirección por defecto de forma atómica en una transacción Prisma
    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      // A. Crear registro en tabla 'usuarios' (Rol por defecto: CLIENTE)
      const user = await tx.usuarios.create({
        data: {
          id: usuarioId,
          email,
          password: hashedPassword,
          rol: 'CLIENTE',
          updated_at: new Date()
        }
      });

      // B. Crear registro en tabla 'datos_personales'
      await tx.datos_personales.create({
        data: {
          id: datosPersonalesId,
          usuario_id: usuarioId,
          nombre: name,
          apellido_paterno: lastName,
          dni,
          updated_at: new Date()
        }
      });

      // C. Crear registro de dirección principal en tabla 'direcciones'
      await tx.direcciones.create({
        data: {
          id: direccionId,
          usuario_id: usuarioId,
          direccion: address,
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: district,
          referencia: 'Dirección de registro inicial',
          es_principal: true,
          updated_at: new Date()
        }
      });

      return user;
    });

    res.status(201).json({
      message: '¡Registro de usuario completado con éxito absoluto!',
      userId: nuevoUsuario.id
    });
  } catch (error) {
    console.error('[Error en register]:', error);
    res.status(500).json({ error: 'Ocurrió un error al registrar el usuario en el servidor.' });
  }
};

// 2. Endpoint de Inicio de Sesión (Login)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, introduce tu correo y contraseña.' });
    }

    // Buscar al usuario por correo en la base de datos
    const user = await prisma.usuarios.findUnique({
      where: { email },
      include: {
        datos_personales: true,
        direcciones: {
          where: { es_principal: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Las credenciales introducidas son incorrectas.' });
    }

    // Validar contraseña cifrada
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Las credenciales introducidas son incorrectas.' });
    }

    // Generar Firma JWT utilizando la clave compartida de Supabase
    const JWT_SECRET = process.env.JWT_SECRET || 'NoirEssenceSuperSecureSecretKey2026Token';
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '30d' } // Validez de 30 días para sesión móvil estable
    );

    const datos = user.datos_personales;
    const dirPrincipal = user.direcciones[0];

    res.status(200).json({
      message: '¡Autenticación exitosa!',
      token,
      profile: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        name: datos ? datos.nombre : 'Cliente',
        lastName: datos ? datos.apellido_paterno : '',
        dni: datos ? datos.dni : '',
        address: dirPrincipal ? dirPrincipal.direccion : '',
        district: dirPrincipal ? dirPrincipal.distrito : ''
      }
    });
  } catch (error) {
    console.error('[Error en login]:', error);
    res.status(500).json({ error: 'Ocurrió un error al iniciar sesión en el servidor.' });
  }
};

// 3. Endpoint para obtener el perfil del usuario autenticado
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    const user = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      include: {
        datos_personales: true,
        direcciones: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const datos = user.datos_personales;

    res.status(200).json({
      id: user.id,
      email: user.email,
      rol: user.rol,
      name: datos ? datos.nombre : '',
      lastName: datos ? datos.apellido_paterno : '',
      dni: datos ? datos.dni : '',
      addresses: user.direcciones.map((d) => ({
        id: d.id,
        address: d.direccion,
        district: d.distrito,
        isPrincipal: d.es_principal
      }))
    });
  } catch (error) {
    console.error('[Error en getProfile]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el perfil de usuario.' });
  }
};

// 4. Endpoint para actualizar los datos del perfil y dirección principal del cliente en Supabase
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const { name, lastName, dni, address, district } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado. Por favor inicia sesión.' });
    }

    if (!name || !lastName || !dni || !address || !district) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios para actualizar el perfil.' });
    }

    // Actualizar datos personales y dirección en una transacción atómica de Prisma
    const perfilActualizado = await prisma.$transaction(async (tx) => {
      // A. Upsert (Actualizar o Crear) de Datos Personales
      await tx.datos_personales.upsert({
        where: { usuario_id: usuarioId },
        update: {
          nombre: name,
          apellido_paterno: lastName,
          dni,
          updated_at: new Date()
        },
        create: {
          id: crypto.randomUUID(),
          usuario_id: usuarioId,
          nombre: name,
          apellido_paterno: lastName,
          dni,
          updated_at: new Date()
        }
      });

      // B. Buscar si ya existe una dirección principal registrada
      const dirPrincipal = await tx.direcciones.findFirst({
        where: { usuario_id: usuarioId, es_principal: true }
      });

      if (dirPrincipal) {
        // Actualizar la dirección y distrito existentes
        await tx.direcciones.update({
          where: { id: dirPrincipal.id },
          data: {
            direccion: address,
            distrito: district,
            updated_at: new Date()
          }
        });
      } else {
        // Crear una nueva dirección marcada como principal
        await tx.direcciones.create({
          data: {
            id: crypto.randomUUID(),
            usuario_id: usuarioId,
            direccion: address,
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: district,
            es_principal: true,
            updated_at: new Date()
          }
        });
      }

      return {
        id: usuarioId,
        email: req.user?.email,
        rol: req.user?.rol,
        name,
        lastName,
        dni,
        address,
        district
      };
    });

    res.status(200).json({
      message: '¡Perfil actualizado con éxito absoluto!',
      profile: perfilActualizado
    });
  } catch (error) {
    console.error('[Error en updateProfile]:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar el perfil en el servidor.' });
  }
};
