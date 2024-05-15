/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import { IntParam } from "firebase-functions/lib/params/types";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
admin.initializeApp();

export const helloWorld = onRequest((request, response) =>{
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const verTabelaUsuario = functions.https.onRequest(
  async (request, response) =>{
    try{
      const usuariosSnapshot = await admin
        .firestore()
        .collection("usuarios")
        .get();
      const usuariosData = usuariosSnapshot.docs.map((doc) => doc.data());
      console.log("Usuários:", usuariosData);
      response.send(usuariosData); // Envia os resultados para o cliente (opcional)
    } catch (error) {
      console.error('Erro ao consultar a coleção "usuarios":', error);
      response.status(500).send('Erro ao consultar a coleção "usuarios"');
    }
  },
);

export const validarLogin = functions.https.onCall(async (data, context) => {
  try {
    const { email, password } = data;
    const usuariosRef = admin.firestore().collection("usuarios");
    const usuarioQuery = await usuariosRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (usuarioQuery.empty) {
      console.log("Usuário não encontrado");
      return {success: false, message: "Usuário não encontrado"};
    }

    const usuarioDoc = usuarioQuery.docs[0];
    const usuarioData = usuarioDoc.data();
    const usuarioPassword = usuarioData.password;
    const usuarioNome = usuarioData.usuarioo;

    if (usuarioPassword === password) {
      console.log(`Bem-Vindo de volta ${usuarioNome}`);
      return {success: true, message: `Bem-Vindo de volta ${usuarioNome}`};} else{
      console.log("Senha Incorreta");
      return {success: false, message: "Senha Incorreta" };
    }} catch (error) {
    console.error("Erro ao validar login:", error);
    return {success: false, message: "Erro ao validar login" };}
});

export const alterarSenha = functions.https.onCall(async (data, context) => {
  try {
    // Verifica se o usuário está autenticado
    if (!context.auth || !context.auth.token.email) {
      console.error("Usuário não autenticado.");
      return {success: false, message: "Usuário não autenticado." };}

      const {novaSenha} = data;
      const {email} = context.auth.token;

      const numeroAleatorio = Math.floor(Math.random() * 9000) + 1000;

      const resetLink = await admin.auth().generatePasswordResetLink(email);

      console.log("E-mail de alteração de senha enviado com sucesso!");
      return {
      success: true,
      message: "E-mail de alteração de senha enviado com sucesso!"};
    }
    catch (error){
      console.error("Erro ao enviar e-mail de alteração de senha:", error);
      return{
        success: false,
        message: "Erro ao enviar e-mail de alteração de senha."};
    }
});

exports.cadastrarMedicamento = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  const { nomeDoMedicamento, tempoParaTomar } = data;
  

  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }
  
 
  const emailClient = context.auth.token.email;


  const medicamentoRef = db.collection('medicamentos').doc();

  try {
      await medicamentoRef.set({
          email: emailClient,
          nome_medicamento: nomeDoMedicamento,
          tempo_para_tomar: tempoParaTomar
      });
      console.log("Cadastrado com sucesso!");
      return { message: "Cadastrado com sucesso!" };
  } catch (error) {
      console.error("Problemas ao cadastrar", error);
      throw new functions.https.HttpsError('internal', 'Problemas ao cadastrar.');
  }
});

exports.consultarTodosOsMedicamentosDoEmail = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }
  
  
  const emailClient = context.auth.token.email;

  try {
     
      const snapshot = await db.collection('medicamentos').where('email', '==', emailClient).get();
      
      
      const medicamentos: { nome_medicamento: string, tempo_para_tomar: string }[] = [];
      snapshot.forEach(doc => {
          const medicamento = doc.data();
          medicamentos.push({
              nome_medicamento: medicamento.nome_medicamento,
              tempo_para_tomar: medicamento.tempo_para_tomar
          });
      });

      return medicamentos;
  } catch (error) {
      console.error("Problemas ao consultar os medicamentos", error);
      throw new functions.https.HttpsError('internal', 'Problemas ao consultar os medicamentos.');
  }
});
exports.editarMedicamento = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // Verifica se o usuário está autenticado
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Obtém o email do usuário autenticado
  const emailClient = context.auth.token.email;
  
  // Obtém os parâmetros passados
  const { nomeDoMedicamento, tempoParaTomar } = data;

  try {
      // Consulta o documento do medicamento do usuário
      const medicamentoRef = db.collection('medicamentos').where('email', '==', emailClient).where('nome_medicamento', '==', nomeDoMedicamento);
      const snapshot = await medicamentoRef.get();

      if (snapshot.empty) {
          throw new functions.https.HttpsError('not-found', 'Medicamento não encontrado para este usuário.');
      }

      // Atualiza o documento do medicamento
      snapshot.forEach(doc => {
          doc.ref.update({
              tempo_para_tomar: tempoParaTomar
          });
      });

      console.log("As definições do remédio foram atualizadas!");
      return { message: "As definições do remédio foram atualizadas!" };
  } catch (error) {
      console.error("Erro ao atualizar o medicamento:", error);
      throw new functions.https.HttpsError('internal', 'Erro ao atualizar o medicamento.');
  }
});
exports.excluirMedicamento = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // Verifica se o usuário está autenticado
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Obtém o email do usuário autenticado
  const emailClient = context.auth.token.email;
  
  // Obtém os parâmetros passados
  const { certeza, nomeDoMedicamento } = data;

  if (!certeza) {
      throw new functions.https.HttpsError('invalid-argument', 'Confirmação necessária para excluir o medicamento.');
  }

  try {
      // Consulta o documento do medicamento do usuário
      const medicamentoRef = db.collection('medicamentos').where('email', '==', emailClient).where('nome_medicamento', '==', nomeDoMedicamento);
      const snapshot = await medicamentoRef.get();

      if (snapshot.empty) {
          throw new functions.https.HttpsError('not-found', 'Medicamento não encontrado para este usuário.');
      }

      // Exclui o documento do medicamento
      snapshot.forEach(doc => {
          doc.ref.delete();
      });

      console.log("Medicamento excluído!");
      return { message: "Medicamento excluído!" };
  } catch (error) {
      console.error("Erro ao excluir o medicamento:", error);
      throw new functions.https.HttpsError('internal', 'Erro ao excluir o medicamento.');
  }
});
exports.cadastrarNovaConsulta = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // Verifica se o usuário está autenticado
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Obtém o email do usuário autenticado
  const emailClient = context.auth.token.email;

  // Obtém os parâmetros passados
  const { dataConsulta, qualTipoDeConsulta } = data;

  try {
      // Adiciona um novo documento de consulta
      await db.collection('consultasmedicas').add({
          emailpaciente: emailClient,
          data: dataConsulta,
          qualmedico: qualTipoDeConsulta
      });

      console.log("Consulta Cadastrada!");
      return { message: "Consulta Cadastrada!" };
  } catch (error) {
      console.error("Erro ao cadastrar a consulta:", error);
      throw new functions.https.HttpsError('internal', 'Erro ao cadastrar a consulta.');
  }
});

exports.editarConsulta = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // Verifica se o usuário está autenticado
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Obtém o email do usuário autenticado
  const emailClient = context.auth.token.email;

  // Obtém os parâmetros passados
  const { dataConsulta, qualTipoDeConsulta } = data;

  try {
      // Consulta o documento da consulta do usuário
      const consultaRef = db.collection('consultasmedicas').where('emailpaciente', '==', emailClient).where('qualmedico', '==', qualTipoDeConsulta);
      const snapshot = await consultaRef.get();

      if (snapshot.empty) {
          throw new functions.https.HttpsError('not-found', 'Consulta não encontrada para este usuário.');
      }

      // Atualiza o documento da consulta
      snapshot.forEach(doc => {
          doc.ref.update({
              data: dataConsulta
          });
      });

      console.log("Consulta alterada!");
      return { message: "Consulta alterada!" };
  } catch (error) {
      console.error("Erro ao alterar a consulta:", error);
      throw new functions.https.HttpsError('internal', 'Erro ao alterar a consulta.');
  }
});

exports.excluirConsulta = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // Verifica se o usuário está autenticado
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Obtém o email do usuário autenticado
  const emailClient = context.auth.token.email;

  // Obtém os parâmetros passados
  const { qualTipoDeConsulta } = data;

  try {
      // Consulta o documento da consulta do usuário
      const consultaRef = db.collection('consultasmedicas').where('emailpaciente', '==', emailClient).where('qualmedico', '==', qualTipoDeConsulta);
      const snapshot = await consultaRef.get();

      if (snapshot.empty) {
          throw new functions.https.HttpsError('not-found', 'Consulta não encontrada para este usuário.');
      }

      // Exclui o documento da consulta
      snapshot.forEach(doc => {
          doc.ref.delete();
      });

      console.log("Consulta excluída!");
      return { message: "Consulta excluída!" };
  } catch (error) {
      console.error("Erro ao excluir a consulta:", error);
      throw new functions.https.HttpsError('internal', 'Erro ao excluir a consulta.');
  }
});

exports.excluirTodasAsConsultasDoEmail = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // Verifica se o usuário está autenticado
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Obtém o email do usuário autenticado
  const emailClient = context.auth.token.email;

  try {
      // Consulta todos os documentos de consultas do usuário
      const snapshot = await db.collection('consultasmedicas').where('emailpaciente', '==', emailClient).get();
      
      // Exclui todos os documentos encontrados
      const batch = db.batch();
      snapshot.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();

      console.log("Todas as consultas excluídas!");
      return { message: "Todas as consultas excluídas!" };
  } catch (error) {
      console.error("Erro ao excluir as consultas:", error);
      throw new functions.https.HttpsError('internal', 'Erro ao excluir as consultas.');
  }
});

