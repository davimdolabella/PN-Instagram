require('dotenv').config();
const express = require('express')
const app = express();
const mongoose = require('mongoose')
const UsersModel = require('./models/UsersModel.js')
const cors = require('./middlewares/cors.js')
app.use(express.json())
app.use(cors('https://davimdolabella.github.io'))
const ConnectDB = async ()=>{
    const mongo_uri = process.env.MONGO_URI
    try {
        await mongoose.connect(mongo_uri)
        console.log('MONGO conectado com sucesso!')
    } catch (error) {
        console.log('Tente novamente, erro ao conectar mongo!')
    }
}
ConnectDB();

// Post Instagram users
app.post('/users/register', async (req, res)=>{
    const {username} = req.body;
    // Simple Validation
    if(!username){
        return res.status(422).json({msg: 'Preencha o dado corretamente!'})
    }

    const user = await UsersModel.findOne({username: username})
    if(user){
        return res.status(401).json({msg: 'Este Usuário já foi inserido!'})
    }
    const newUser = await UsersModel.create({
        username: username,
        link: `https://www.instagram.com/${username}/`
    })
    try {
        await newUser.save();
        res.status(200).json({msg: 'Usuário inserido com sucesso!', newUser})
    } catch (error) {
        res.status(500).json({msg: 'Erro ao inserir usuário!'})
    }
})

app.get('/users/all', async (req, res) =>{
    try {
        const users = await UsersModel.find().sort({ status: 1, username: 1 })
        res.status(200).json({msg: 'Sucesso ao pegar todos os usuários!', users})
    } catch (error) {
        res.status(500).json({msg:'Erro ao pegar os usuários.'})
    }
})

app.get('/users/:username', async (req, res)=>{
    const {username} = req.params
    const user = await UsersModel.findOne({username: username})
    if(!user){
        return res.status(404).json('Usuario Não encontrado!')
    }
    res.status(200).json({msg:'Usuário encontrado com sucesso!', user})
})

app.put('/users/:username', async (req, res)=>{
    const {status} = req.body
    const {username} = req.params
    const user = await UsersModel.findOne({username: username})
    if(!user){
        return res.status(404).json('Usuario Não encontrado!')
    }
    const userId = user.id
    try {
        const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        {status: status},
        { new: true } 
        );

        res.status(200).json({msg: 'Status alterado com sucesso!',updatedUser});
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar usuário', error: err });
    }
})



app.listen(3000, ()=>{
    console.log('Servidor Rodando em http://localhost:3000')
})
