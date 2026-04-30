const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = 3000;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
const api_chave = "segredo"

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Conexão com banco
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tcc'
});

// ---------------- TOKEN ----------------

function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, api_chave, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Token inválido" });
      }
      req.user = user;
      next();
    });
};

// 🔥 NOVO: VERIFICA ADMIN
function verificarAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado: somente admin" });
    }
    next();
}

// ---------------- GETs ----------------

// 🔒 SOMENTE ADMIN
app.get('/clientes', autenticarToken, verificarAdmin, async (req, res) => {
    try {
        const sql = 'SELECT * FROM clientes';
        const [rows] = await db.query(sql);
        return res.json(rows);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success:false });
    }
});

// 🔒 SOMENTE ADMIN
app.get('/pedidos', autenticarToken, verificarAdmin, async (req,res)=> {
    try {
        const sql = 'SELECT * FROM pedidos';
        const [rows] = await db.query(sql);
        return res.json(rows);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success:false });
    }
});

// 🔓 PÚBLICO
app.get('/verProdutos', async (req,res)=>{
    try {
        const sql = 'SELECT * FROM produtos';
        const [ rows ] = await db.query(sql);
        return res.json(rows);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success:false });
    }
});

// 🔒 SOMENTE ADMIN
app.get('/clientes/:id', autenticarToken, verificarAdmin, async (req, res) => {
    try{
        const { id } = req.params;

        const sql = 'SELECT * FROM clientes WHERE id_cliente = ?';
        const [rows] = await db.query(sql, [id]);

        if(rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "Cliente não encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.log("Erro ao buscar cliente:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// 🔓 PÚBLICO
app.get('/produtos/:id', async (req,res) =>{
    try{
        const { id } = req.params;

        const sql = 'SELECT * FROM produtos WHERE id_produtos = ?';
        const [rows] = await db.query(sql, [id]);

        if(rows.length === 0){
            return res.status(404).json({
                success:false,
                message:"produto nao encontrado"
            });
        }

        return res.status(200).json({
            sucess:true,
            data: rows[0]
        });
    } catch (error) {
        console.log("erro ao buscar", error);
        return res.status(500).json({
            success:false,
            message:"erro interno do servidor"
        });
    }
});

// ---------------- POSTs ----------------

// 🔓 CADASTRO NORMAL
app.post('/cadastro', async (req,res) => {
    try {
        const { nome, email, senha} = req.body;

        const senhaHash = crypto
            .createHash('sha256')
            .update(senha)
            .digest('hex');

        const sql = `INSERT INTO clientes (nome, email, senha) VALUES(?,?,?)`

        const [resultado] = await db.query(sql,[nome, email, senhaHash]);

        return res.json({
            sucess:true,
            message:"Vc foi cadastrado com sucesso",
            id:resultado.insertId
        });
    } catch (error) {
        console.log("erro ao cadastrar", error);
        return res.json({
            sucess:false,
            message:"erro ao cadastrar"
        })
    }
});

// 🔒 SOMENTE ADMIN
app.post('/entregadores', autenticarToken, verificarAdmin, async (req,res) => {
    try {
        const { nome, email, CNH, senha} = req.body;

        const senhaHash = crypto
            .createHash('sha256')
            .update(senha)
            .digest('hex');

        const sql = `INSERT INTO entregadores (nome, email, CNH, senha) VALUES(?,?,?,?)`

        const [resultado] = await db.query(sql,[nome, email,CNH, senhaHash]);

        return res.json({
            sucess:true,
            message:"Vc foi cadastrado com sucesso",
            id:resultado.insertId
        });
    } catch (error) {
        console.log("erro ao cadastrar", error);
        return res.json({
            sucess:false,
            message:"erro ao cadastrar"
        })
    }
});

// 🔒 SOMENTE ADMIN
app.post('/ADCprodutos', autenticarToken, verificarAdmin, async (req,res) =>{
    try {
        const { id_produtos, nome, descricao, preco, categoria } = req.body;

        const sql = `INSERT INTO produtos (id_produtos, nome, descricao, preco, categoria) VALUES (?,?,?,?,?)`
        
        const [resultado] = await db.query(sql,[id_produtos,nome,descricao,preco,categoria]);

        return res.json({
            sucess:true,
            message:"Produto adicionado",
            id:resultado.insertId
        });
    } catch (error) {
        console.log("erro ao adicionar", error);
        return res.json({
            success:false,
            message:"erro ao adicionar"
        })
    }
});

// ---------------- LOGIN ----------------

app.post("/login",async (req,res)=>{
    const { email, senha } = req.body
    try {
        const [resultado] = await db.execute(`SELECT * FROM clientes WHERE email = ?`,[email])

        if (resultado.length > 0 ){
            const usuario = resultado[0]

            const senhaHash = crypto
                .createHash('sha256')
                .update(senha)
                .digest('hex');

            if (senhaHash !== usuario.senha) {
                return res.status(401).json({"mensagem":"usuario ou senha invalido"})
            }

            // 🔥 CORRIGIDO AQUI
            const token = jwt.sign({
                email: email,
                role: usuario.role // 🔥 AQUI É O PASSO 4
            }, api_chave, {
                expiresIn: "1h"
            });

            res.json({"mensagem":"acesso liberado","token":token})

        } else {
            return res.json({"mensagem":"nenhum email encontrado"})
        }

    } catch (error) {
        console.log(error)
        return res.json({"mensagem":"erro ao fazer login"})
    }
});

// ---------------- PERFIL ----------------

app.post("/perfil", autenticarToken,(req,res)=>{
    res.send(req.user)
})

// ---------------- SERVER ----------------

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});