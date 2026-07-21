# Ultrafarma Reserva de Salas - V4

Sistema interno para agendamento de salas de reunião e auditório.

## Ajustes desta versão

- Tela inicial corrigida.
- Removidas as credenciais visíveis da tela de login.
- Login do admin mantido conforme solicitado:
  - E-mail: `admin@ultrafarma.com`
  - Senha: `admin123`
- Mapa ao vivo apenas informativo: ao clicar na sala, mostra dados da reserva e não abre reserva.
- Topo sem identificação do colaborador logado; aparece apenas o botão **Sair**.
- Aba **Salas** preparada para galeria de fotos com scroll horizontal.
- Preparado para sincronizar dados no Firebase Firestore.

## Estrutura correta no GitHub

Suba todos os arquivos na raiz do repositório:

```txt
index.html
app.js
styles.css
firebase-config.js
vercel.json
README.md
assets/
logo-ultrafarma.png
logo-u.png
sala-1.jpeg
sala-4.jpeg
sala-5.jpeg
sala-7.jpeg
sala-8.jpeg
mapa-referencia.png
```

## Como adicionar o projeto no Firebase

### 1. Criar projeto

1. Acesse o Firebase Console.
2. Clique em **Adicionar projeto**.
3. Nome sugerido: `salas-ultrafarma`.
4. Pode desativar o Google Analytics neste primeiro momento.
5. Clique em **Criar projeto**.

### 2. Criar o app Web

1. Dentro do projeto, clique no ícone **Web** `</>`.
2. Nome do app: `Reserva de Salas Ultrafarma`.
3. Não precisa marcar Firebase Hosting, pois o site ficará no Vercel.
4. Clique em **Registrar app**.
5. Copie o bloco de configuração parecido com este:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Configurar o arquivo `firebase-config.js`

Abra o arquivo `firebase-config.js` e preencha com os dados do Firebase.

Troque isto:

```js
window.USE_FIREBASE = false;
```

por isto:

```js
window.USE_FIREBASE = true;
```

E cole os dados do seu projeto:

```js
window.firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

### 4. Ativar o Firestore Database

1. No menu lateral do Firebase, vá em **Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Para testar, escolha **Modo de teste**.
4. Escolha a região mais próxima, por exemplo `southamerica-east1` se estiver disponível.
5. Conclua a criação.

O sistema vai criar automaticamente um documento em:

```txt
ultrafarma_reserva_salas/database
```

Nesse documento ficarão salvos usuários, salas, horários, reservas e configurações.

### 5. Regras temporárias para teste

Para testar rapidamente, use regras abertas por um período curto:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Depois da validação, o ideal é evoluir para Firebase Authentication e regras protegidas.

## Importante

O sistema mantém o admin padrão internamente:

```txt
admin@ultrafarma.com / admin123
```

Essas credenciais não aparecem mais na tela inicial.

Se você já testou versões antigas, limpe o cache usando `Ctrl + F5` ou abra em janela anônima.
Também pode apagar os dados antigos em DevTools > Application > Local Storage > `ultraReservaDataV2`.
