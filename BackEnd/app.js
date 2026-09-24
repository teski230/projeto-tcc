const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const multer = require("multer");

const app = express();
const PORT = 3000;

const api_chave = "sua_chave_secreta_aqui";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        const nome = Date.now() + "-" + file.originalname;
        cb(null, nome);
    }
});

const upload = multer({
    storage: storage
});




app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// ==================== MIDDLEWARES ====================

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


app.use("/uploads", express.static("uploads"));

// ==================== CONEXÃO COM BANCO ====================

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tcc',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ==================== AUTENTICAÇÃO ====================

const autenticarToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            mensagem: "Token não fornecido"
        });
    }

    jwt.verify(token, api_chave, (err, user) => {

        if (err) {
            return res.status(403).json({
                success: false,
                mensagem: "Token inválido ou expirado"
            });
        }

        req.user = user;

        next();
    });
};


// ==================== LOGIN CLIENTE ====================

app.post("/login", async (req, res) => {

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            success: false,
            mensagem: "Email e senha são obrigatórios"
        });
    }

    try {

        const [rows] = await db.query(
            "SELECT * FROM clientes WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                mensagem: "Email não encontrado"
            });
        }

        const user = rows[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            user.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                success: false,
                mensagem: "Senha incorreta"
            });
        }

        const token = jwt.sign(
            {
                id: user.id_cliente,
                email: user.email,
                role: user.role || "user"
            },
            api_chave,
            {
                expiresIn: "24h"
            }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id_cliente,
                nome: user.nome,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Erro no Login:", error);

        res.status(500).json({
            success: false,
            mensagem: "Erro interno no servidor"
        });
    }
});


// ==================== CADASTRO CLIENTE ====================

app.post('/cadastro', async (req, res) => {

    try {

        const {
            nome,
            email,
            senha,
            bairro,
            rua,
            telefone,
            N_casa
        } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: "Nome, email e senha são obrigatórios"
            });
        }

        const [existeEmail] = await db.query(
            "SELECT id_cliente FROM clientes WHERE email = ?",
            [email]
        );

        if (existeEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email já cadastrado"
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const [resultado] = await db.query(
            `INSERT INTO clientes
            (nome, email, senha, bairro, rua, telefone, N_casa)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                email,
                senhaHash,
                bairro || null,
                rua || null,
                telefone || null,
                N_casa || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Cadastrado com sucesso",
            id: resultado.insertId
        });

    } catch (error) {

        console.error("Erro no cadastro:", error);

        res.status(500).json({
            success: false,
            message: "Erro interno no servidor"
        });
    }
});


// ==================== PRODUTOS ====================

// Listar produtos

app.get('/produtos', async (req, res) => {

    try {

        const [rows] = await db.query(
            'SELECT * FROM produtos ORDER BY id_produto'
        );

        res.json(rows);

    } catch (error) {

        console.error("Erro ao buscar produtos:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao buscar produtos"
        });
    }
});


// Buscar produto por ID

app.get('/produtos/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM produtos WHERE id_produto = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Produto não encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("Erro ao buscar produto:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao buscar produto"
        });
    }
});


// Adicionar produto

// ==================== ADICIONAR PRODUTO ====================

app.post('/ADCprodutos', autenticarToken, upload.single("imagem"), async (req, res) => {
    try {

        const {
            nome,
            descricao,
            preco,
            categoria
        } = req.body;

        if (!nome || !preco || !categoria) {
            return res.status(400).json({
                success: false,
                message: "Nome, preço e categoria são obrigatórios"
            });
        }

        // Verifica se a categoria existe
        const [categoriaExiste] = await db.query(
            "SELECT id_categoria FROM categorias WHERE id_categoria = ?",
            [categoria]
        );

        if (categoriaExiste.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Categoria não encontrada"
            });
        }

        // Caminho da imagem
        let imagem = null;

        if (req.file) {
            imagem = "/uploads/" + req.file.filename;
        }

        // Cadastra o produto
        const [resultado] = await db.query(
            `INSERT INTO produtos
            (nome, descricao, preco, categoria, imagem)
            VALUES (?, ?, ?, ?, ?)`,
            [
                nome,
                descricao || null,
                preco,
                categoria,
                imagem
            ]
        );

        res.status(201).json({
            success: true,
            message: "Produto adicionado com sucesso",
            id: resultado.insertId,
            imagem: imagem
        });

    } catch (error) {

        console.error("ERRO AO ADICIONAR PRODUTO:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao adicionar produto",
            erro: error.message
        });
    }
});


// Atualizar produto

// ==================== ATUALIZAR PRODUTO ====================

app.put('/ATZprodutos/:id', autenticarToken, async (req, res) => {
    try {

        const { id } = req.params;

        const {
            nome,
            descricao,
            preco,
            categoria,
            imagem
        } = req.body;

        if (!nome || !preco || !categoria) {
            return res.status(400).json({
                success: false,
                message: "Nome, preço e categoria são obrigatórios"
            });
        }

        // Verifica se o produto existe
        const [produto] = await db.query(
            'SELECT id_produto FROM produtos WHERE id_produto = ?',
            [id]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Produto não encontrado"
            });
        }

        // Verifica a categoria
        const [categoriaExiste] = await db.query(
            'SELECT id_categoria FROM categorias WHERE id_categoria = ?',
            [categoria]
        );

        if (categoriaExiste.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Categoria não encontrada"
            });
        }

        const sql = `
            UPDATE produtos
            SET
                nome = ?,
                descricao = ?,
                preco = ?,
                categoria = ?,
                imagem = ?
            WHERE id_produto = ?
        `;

        await db.query(sql, [
            nome,
            descricao || null,
            preco,
            categoria,
            imagem || null,
            id
        ]);

        res.json({
            success: true,
            message: "Produto atualizado com sucesso"
        });

    } catch (error) {

        console.error("ERRO AO ATUALIZAR PRODUTO:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao atualizar produto",
            erro: error.message
        });

    }
});


// Deletar produto

app.delete('/DELprodutos/:id', autenticarToken, async (req, res) => {

    try {

        const { id } = req.params;

        const [existe] = await db.query(
            'SELECT id_produto FROM produtos WHERE id_produto = ?',
            [id]
        );

        if (existe.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Produto não encontrado"
            });
        }

        await db.query(
            'DELETE FROM produtos WHERE id_produto = ?',
            [id]
        );

        res.json({
            success: true,
            message: "Produto deletado com sucesso"
        });

    } catch (error) {

        console.error("Erro ao deletar produto:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao deletar produto"
        });
    }
});


// Rota alternativa para produtos

app.get('/verProdutos', async (req, res) => {

    try {

        const [produtos] = await db.query(
            'SELECT * FROM produtos'
        );

        res.json(produtos);

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro: 'Erro ao buscar produtos'
        });
    }
});

// ==================== CATEGORIAS ====================

app.get('/categorias', async (req, res) => {
    try {

        const [rows] = await db.query(
            'SELECT id_categoria, nome FROM categorias ORDER BY nome'
        );

        res.json(rows);

    } catch (error) {

        console.error("Erro ao buscar categorias:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao buscar categorias"
        });

    }
});

// ==================== CLIENTES ====================

// Listar clientes

app.get('/clientes', autenticarToken, async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id_cliente,
                nome,
                email,
                bairro,
                rua,
                telefone,
                N_casa
            FROM clientes
        `);

        res.json(rows);

    } catch (error) {

        console.error("Erro ao buscar clientes:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao buscar clientes"
        });
    }
});


// Buscar cliente

app.get('/clientes/:id', autenticarToken, async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id_cliente,
                nome,
                email,
                bairro,
                rua,
                telefone,
                N_casa
            FROM clientes
            WHERE id_cliente = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cliente não encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("Erro ao buscar cliente:", error);

        res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});


// ==================== PEDIDOS ====================

// Listar pedidos

app.get('/pedidos', autenticarToken, async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                p.*,
                c.nome AS cliente_nome
            FROM pedidos p
            LEFT JOIN clientes c
                ON p.id_cliente = c.id_cliente
            ORDER BY p.id_pedido DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error("Erro ao buscar pedidos:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao buscar pedidos"
        });
    }
});


// Pedidos por cliente

app.get('/pedidos/cliente/:id_cliente', autenticarToken, async (req, res) => {

    try {

        const { id_cliente } = req.params;

        const [rows] = await db.query(
            `
            SELECT *
            FROM pedidos
            WHERE id_cliente = ?
            ORDER BY data_pedido DESC
            `,
            [id_cliente]
        );

        res.json(rows);

    } catch (error) {

        console.error(
            "Erro ao buscar pedidos do cliente:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro ao buscar pedidos"
        });
    }
});


// Criar pedido

app.post('/pedidos', autenticarToken, async (req, res) => {

    try {

        const {
            id_cliente,
            bairro,
            rua,
            numero,
            complemento,
            valor,
            telefone,
            forma_pagamento,
            troco_para
        } = req.body;

        if (
            !id_cliente ||
            !bairro ||
            !rua ||
            !numero ||
            !valor ||
            !forma_pagamento
        ) {

            return res.status(400).json({
                success: false,
                message: "Campos obrigatórios faltando"
            });
        }

        const sql = `
            INSERT INTO pedidos
            (
                id_cliente,
                bairro,
                rua,
                numero,
                complemento,
                valor,
                telefone,
                status,
                forma_pagamento,
                troco_para
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?)
        `;

        const [resultado] = await db.query(
            sql,
            [
                id_cliente,
                bairro,
                rua,
                numero,
                complemento || null,
                valor,
                telefone || null,
                forma_pagamento,
                troco_para || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Pedido criado com sucesso",
            id: resultado.insertId
        });

    } catch (error) {

        console.error("Erro ao criar pedido:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao criar pedido"
        });
    }
});


// Atualizar status do pedido

app.put('/pedidos/:id/status', autenticarToken, async (req, res) => {

    try {

        const { id } = req.params;

        const { status } = req.body;

        const statusPermitidos = [
            'pendente',
            'confirmado',
            'preparando',
            'saiu_entrega',
            'entregue',
            'cancelado'
        ];

        if (!statusPermitidos.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Status inválido"
            });
        }

        const [existe] = await db.query(
            'SELECT id_pedido FROM pedidos WHERE id_pedido = ?',
            [id]
        );

        if (existe.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Pedido não encontrado"
            });
        }

        await db.query(
            'UPDATE pedidos SET status = ? WHERE id_pedido = ?',
            [status, id]
        );

        res.json({
            success: true,
            message: "Status do pedido atualizado"
        });

    } catch (error) {

        console.error(
            "Erro ao atualizar status:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro ao atualizar status"
        });
    }
});


// ======================================================
// ENTREGADORES
// ======================================================


// ==================== CADASTRO ENTREGADOR ====================

app.post('/entregadores/solicitar', async (req, res) => {

    try {

        const {
            nome,
            email,
            CNH,
            senha
        } = req.body;

        if (!nome || !email || !CNH || !senha) {

            return res.status(400).json({
                success: false,
                message: "Nome, email, CNH e senha são obrigatórios"
            });
        }

        const [existeEmail] = await db.query(
            `
            SELECT id_entregador
            FROM entregadores
            WHERE email = ?
            `,
            [email]
        );

        if (existeEmail.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Email já cadastrado"
            });
        }

        const senhaHash = await bcrypt.hash(
            senha,
            10
        );

        const sql = `
            INSERT INTO entregadores
            (
                nome,
                email,
                CNH,
                senha,
                status
            )
            VALUES (?, ?, ?, ?, 'pendente')
        `;

        const [resultado] = await db.query(
            sql,
            [
                nome,
                email,
                CNH,
                senhaHash
            ]
        );

        res.status(201).json({
            success: true,
            message: "Solicitação enviada! Aguarde a aprovação do administrador.",
            id: resultado.insertId
        });

    } catch (error) {

        console.error(
            "Erro ao solicitar cadastro:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro ao solicitar cadastro"
        });
    }
});


// ==================== LOGIN ENTREGADOR ====================

app.post("/entregadores/login", async (req, res) => {

    const {
        email,
        senha
    } = req.body;

    if (!email || !senha) {

        return res.status(400).json({
            success: false,
            mensagem: "Email e senha são obrigatórios"
        });
    }

    try {

        const [rows] = await db.query(
            `
            SELECT *
            FROM entregadores
            WHERE email = ?
            `,
            [email]
        );

        if (rows.length === 0) {

            return res.status(401).json({
                success: false,
                mensagem: "Email não encontrado"
            });
        }

        const entregador = rows[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            entregador.senha
        );

        if (!senhaCorreta) {

            return res.status(401).json({
                success: false,
                mensagem: "Senha incorreta"
            });
        }

        if (entregador.status === 'pendente') {

            return res.status(403).json({
                success: false,
                mensagem: "Seu cadastro está em análise. Aguarde a aprovação do administrador."
            });
        }

        if (entregador.status === 'rejeitado') {

            return res.status(403).json({
                success: false,
                mensagem: "Seu cadastro foi rejeitado. Entre em contato com o suporte."
            });
        }

        const token = jwt.sign(
            {
                id: entregador.id_entregador,
                email: entregador.email,
                role: "entregador"
            },
            api_chave,
            {
                expiresIn: "24h"
            }
        );

        res.json({
            success: true,
            token,
            user: {
                id: entregador.id_entregador,
                nome: entregador.nome,
                email: entregador.email
            }
        });

    } catch (error) {

        console.error(
            "Erro no login do entregador:",
            error
        );

        res.status(500).json({
            success: false,
            mensagem: "Erro interno no servidor"
        });
    }
});


// ======================================================
// LISTAR TODOS OS ENTREGADORES
// ======================================================

app.get('/entregadores', autenticarToken, async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id_entregador,
                nome,
                email,
                CNH,
                status
            FROM entregadores
            ORDER BY id_entregador DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "ERRO AO BUSCAR ENTREGADORES:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro ao buscar entregadores",
            erro: error.message
        });
    }
});


// ======================================================
// LISTAR ENTREGADORES PENDENTES
// ======================================================

app.get('/entregadores/pendentes', autenticarToken, async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id_entregador,
                nome,
                email,
                CNH,
                status
            FROM entregadores
            WHERE status = 'pendente'
            ORDER BY id_entregador DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "ERRO AO BUSCAR ENTREGADORES PENDENTES:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro ao buscar entregadores pendentes",
            erro: error.message
        });
    }
});


// ======================================================
// APROVAR ENTREGADOR
// ======================================================

app.put('/entregadores/:id/aprovar', autenticarToken, async (req, res) => {

    try {

        const { id } = req.params;

        const [existe] = await db.query(
            `
            SELECT id_entregador
            FROM entregadores
            WHERE id_entregador = ?
            `,
            [id]
        );

        if (existe.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Entregador não encontrado"
            });
        }

        await db.query(
            `
            UPDATE entregadores
            SET status = 'aprovado'
            WHERE id_entregador = ?
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Entregador aprovado com sucesso"
        });

    } catch (error) {

        console.error(
            "Erro ao aprovar entregador:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro ao aprovar entregador"
        });
    }
});


// ======================================================
// RECUSAR / REJEITAR ENTREGADOR
// ======================================================

app.put(
    [
        '/entregadores/:id/rejeitar',
        '/entregadores/:id/recusar'
    ],
    autenticarToken,
    async (req, res) => {

        try {

            const { id } = req.params;

            const [existe] = await db.query(
                `
                SELECT id_entregador
                FROM entregadores
                WHERE id_entregador = ?
                `,
                [id]
            );

            if (existe.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Entregador não encontrado"
                });
            }

            await db.query(
                `
                UPDATE entregadores
                SET status = 'rejeitado'
                WHERE id_entregador = ?
                `,
                [id]
            );

            res.json({
                success: true,
                message: "Entregador rejeitado"
            });

        } catch (error) {

            console.error(
                "Erro ao rejeitar entregador:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Erro ao rejeitar entregador"
            });
        }
    }
);

// APROVAR ENTREGADOR
async function aprovarEntregador(id) {

    if (!confirm("Deseja aprovar este entregador?")) return;

    try {

        const res = await fetch(`http://localhost:3000/entregadores/${id}/aprovar`, {
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!res.ok) {
            throw new Error("Erro ao aprovar entregador");
        }

        alert("Entregador aprovado!");

        listarEntregadores();

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível aprovar o entregador.");
    }
}

// RECUSAR ENTREGADOR
async function recusarEntregador(id) {

    if (!confirm("Deseja recusar este entregador?")) return;

    try {

        const res = await fetch(`http://localhost:3000/entregadores/${id}/recusar`, {
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!res.ok) {
            throw new Error("Erro ao recusar entregador");
        }

        alert("Entregador recusado!");

        listarEntregadores();

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível recusar o entregador.");
    }
}


// ==================== ROTA DE TESTE ====================

app.get('/health', (req, res) => {

    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });

});


// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {

    console.log(
        `🚀 Servidor rodando na porta ${PORT}`
    );

    console.log(
        `📍 API: http://localhost:${PORT}`
    );

    console.log(
        `📚 Documentação: http://localhost:${PORT}/api-docs`
    );

    console.log(
        `❤️ Health check: http://localhost:${PORT}/health`
    );

});