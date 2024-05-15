/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
admin.initializeApp();


export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const verTabelaUsuario = functions.https.onRequest(async (request, response) => {
    try {
      const usuariosSnapshot = await admin.firestore().collection('usuarios').get();
      const usuariosData = usuariosSnapshot.docs.map(doc => doc.data());
      console.log('Usuários:', usuariosData);
      response.send(usuariosData); // Envia os resultados para o cliente (opcional)
    } catch (error) {
      console.error('Erro ao consultar a coleção "usuarios":', error);
      response.status(500).send('Erro ao consultar a coleção "usuarios"');
    }
  });

  
export const validarLogin = functions.https.onCall(async (data, context) => {
    try {
      const { email, password } = data;
      const usuariosRef = admin.firestore().collection('usuarios');
      const usuarioQuery = await usuariosRef.where('email', '==', email).limit(1).get();
  
      if (usuarioQuery.empty) {
        console.log('Usuário não encontrado');
        return { success: false, message: 'Usuário não encontrado' };
      }
  
      const usuarioDoc = usuarioQuery.docs[0];
      const usuarioData = usuarioDoc.data();
      const usuarioPassword = usuarioData.password;
      const usuarioNome = usuarioData.usuarioo;
  
      if (usuarioPassword === password) {
        console.log(`Bem-Vindo de volta ${usuarioNome}`);
        return { success: true, message: `Bem-Vindo de volta ${usuarioNome}` };
      } else {
        console.log('Senha Incorreta');
        return { success: false, message: 'Senha Incorreta' };
      }
    } catch (error) {
      console.error('Erro ao validar login:', error);
      return { success: false, message: 'Erro ao validar login' };
    }
  });

  export const alterarSenha = functions.https.onCall(async (data, context) => {
    try {
      // Verifica se o usuário está autenticado
      if (!context.auth || !context.auth.token.email) {
        console.error('Usuário não autenticado.');
        return { success: false, message: 'Usuário não autenticado.' };
      }
  
      const { novaSenha } = data;
      const { email } = context.auth.token;
  
      // Gerar um número aleatório de 4 dígitos
      const numeroAleatorio = Math.floor(Math.random() * 9000) + 1000;
  
      // Gerar o link de redefinição de senha
      const resetLink = await admin.auth().generatePasswordResetLink(email);
  
      // Enviar e-mail com o link de redefinição de senha
      // Aqui você usaria o serviço de e-mail de sua escolha para enviar o e-mail com o link
      // Por exemplo, você poderia usar o SendGrid, Nodemailer, etc.
  
      console.log('E-mail de alteração de senha enviado com sucesso!');
      return { success: true, message: 'E-mail de alteração de senha enviado com sucesso!' };
    } catch (error) {
      console.error('Erro ao enviar e-mail de alteração de senha:', error);
      return { success: false, message: 'Erro ao enviar e-mail de alteração de senha.' };
    }
  });