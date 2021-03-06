import { API, Storage } from 'aws-amplify';
import React, { useState, useEffect } from 'react';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { onCreateNote } from './graphql/subscriptions' 

import { Translations } from "@aws-amplify/ui-components";
import { I18n } from "aws-amplify";

I18n.putVocabulariesForLanguage("en-US", {
  [Translations.BACK_TO_SIGN_IN]: "Voltar para Iniciar Sessão",
  [Translations.CHANGE_PASSWORD_ACTION]: "Alterar",
  [Translations.CHANGE_PASSWORD]: "Alterar senha",
  [Translations.CODE_LABEL]: "Código de verificação",
  [Translations.CODE_PLACEHOLDER]: "Digite o código",
  [Translations.CONFIRM_SIGN_UP_CODE_LABEL]: "Código de confirmação",
  [Translations.CONFIRM_SIGN_UP_CODE_PLACEHOLDER]: "Introduza o seu código",
  [Translations.CONFIRM_SIGN_UP_HEADER_TEXT]: "Confirmar Cadastre-se",
  [Translations.CONFIRM_SIGN_UP_LOST_CODE]: "Perdeu seu código?",
  [Translations.CONFIRM_SIGN_UP_RESEND_CODE]: "Reenviar Código",
  [Translations.CONFIRM_SIGN_UP_SUBMIT_BUTTON_TEXT]: "Confirmar",
  [Translations.CONFIRM_SMS_CODE]: "Confirmar Código SMS",
  [Translations.CONFIRM_TOTP_CODE]: "Confirmar Código TOTP",
  [Translations.CONFIRM]: "Confirmar",
  [Translations.CREATE_ACCOUNT_TEXT]: "Criar conta",
  [Translations.EMAIL_LABEL]: "Endereço de e-mail *",
  [Translations.EMAIL_PLACEHOLDER]: "amplify@example.com",
  [Translations.FORGOT_PASSWORD_TEXT]: "Esqueceu sua senha?",
  [Translations.LESS_THAN_TWO_MFA_VALUES_MESSAGE]: "Menos de dois tipos de mfa disponíveis",
  [Translations.NEW_PASSWORD_LABEL]: "Nova senha",
  [Translations.NEW_PASSWORD_PLACEHOLDER]: "Digite sua nova senha",
  [Translations.NO_ACCOUNT_TEXT]: "Sem conta?",
  [Translations.PASSWORD_LABEL]: "Senha *",
  [Translations.PASSWORD_PLACEHOLDER]: "Digite sua senha",
  [Translations.PHONE_LABEL]: "Número de Telefone*",
  [Translations.PHONE_PLACEHOLDER]: "(555) 555-1212",
  [Translations.QR_CODE_ALT]: "qrcode",
  [Translations.RESET_PASSWORD_TEXT]: "Redefinir senha",
  [Translations.RESET_YOUR_PASSWORD]: "Redefinir sua senha",
  [Translations.SELECT_MFA_TYPE_HEADER_TEXT]: "Selecione o tipo de MFA",
  [Translations.SELECT_MFA_TYPE_SUBMIT_BUTTON_TEXT]: "Verificar",
  [Translations.SEND_CODE]: "Enviar Código",
  [Translations.SETUP_TOTP_REQUIRED]: "O TOTP precisa ser configurado",
  [Translations.SIGN_IN_ACTION]: "Entrar",
  [Translations.SIGN_IN_HEADER_TEXT]: "Entrar na sua conta",
  [Translations.SIGN_IN_TEXT]: "Entrar",
  [Translations.SIGN_IN_WITH_AMAZON]: "Entrar com a Amazon",
  [Translations.SIGN_IN_WITH_AUTH0]: "Entrar com Auth0",
  [Translations.SIGN_IN_WITH_AWS]: "Faça login com a AWS",
  [Translations.SIGN_IN_WITH_FACEBOOK]: "Entrar com o Facebook",
  [Translations.SIGN_IN_WITH_GOOGLE]: "Iniciar sessão com o Google",
  [Translations.SIGN_OUT]: "Sair",
  [Translations.SIGN_UP_EMAIL_PLACEHOLDER]: "E-mail",
  [Translations.SIGN_UP_HAVE_ACCOUNT_TEXT]: "Tem uma conta?",
  [Translations.SIGN_UP_HEADER_TEXT]: "Criar uma nova conta",
  [Translations.SIGN_UP_PASSWORD_PLACEHOLDER]: "Senha",
  [Translations.SIGN_UP_SUBMIT_BUTTON_TEXT]: "Criar conta",
  [Translations.SIGN_UP_USERNAME_PLACEHOLDER]: "Nome de usuário",
  [Translations.SUCCESS_MFA_TYPE]: "Sucesso! Seu tipo de MFA é agora:",
  [Translations.TOTP_HEADER_TEXT]: "Digitalizar e inserir o código de verificação",
  [Translations.TOTP_LABEL]: "Digite o código de segurança:",
  [Translations.TOTP_SETUP_FAILURE]: "A instalação do TOTP falhou",
  [Translations.TOTP_SUBMIT_BUTTON_TEXT]: "Verificar Token de Segurança",
  [Translations.TOTP_SUCCESS_MESSAGE]: "Configurar o TOTP com sucesso!",
  [Translations.UNABLE_TO_SETUP_MFA_AT_THIS_TIME]: "Falha! Não é possível configurar o MFA neste momento",
  [Translations.USERNAME_LABEL]: "Nome de usuário *",
  [Translations.USERNAME_PLACEHOLDER]: "Digite seu nome de usuário",
  [Translations.VERIFY_CONTACT_EMAIL_LABEL]: "E-mail",
  [Translations.VERIFY_CONTACT_HEADER_TEXT]: "Recuperação de conta requer informações de contato verificadas",
  [Translations.VERIFY_CONTACT_PHONE_LABEL]: "Número de telefone",
  [Translations.VERIFY_CONTACT_SUBMIT_LABEL]: "Enviar",
  [Translations.VERIFY_CONTACT_VERIFY_LABEL]: "Verificar"  
  });

I18n.setLanguage("en-US")


const initialFormState = { name: '', description: '' }

function App() {
  const [message, updateMessage] = useState(null)
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
    API.graphql({
      query: onCreateNote
    })
    .subscribe({
      next: messageData => {
        console.log("messageData from subscription:", messageData)
        updateMessage(messageData.value.data.onCreateNote.name)
      }
    })    
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      
      REAL TIME <h1> {message} </h1>
      
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'roomId': e.target.value})}
        placeholder="Note roomId"
        value={formData.roomId}
      />      
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      <input
        type="file"
        onChange={onChange}
      />      
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
      {
        notes.map(note => (
          <div key={note.id || note.name}>
            <h2>{note.name}</h2>
            <p>{note.description}</p>
            <button onClick={() => deleteNote(note)}>Delete note</button>
            {
              note.image && <img src={note.image} style={{width: 400}} />
            }
          </div>
        ))
      } 
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);

/*
function App() {
  return (
    <div className="App">
      <header>
        <img src={logo} className="App-logo" alt="logo" />
        <h1>We now have Auth!</h1>

        <p>
          {I18n.get('appTitle1')} <code>src/App.js</code> {I18n.get('appTitle2')}
        </p>

      </header>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
*/