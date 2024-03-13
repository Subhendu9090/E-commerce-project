const express = require('express');
require('./db/config');
const cors = require('cors');
const User = require('./db/user');

const Product = require('./db/product');

const app = express();

const Jwt = require('jsonwebtoken');
const jwtkey = 'e-comm';

app.use(express.json()); //middle wairs
app.use(cors());         //middle wairs

app.post("/register", async (req, res) => {
    const user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            res.send({ result: "somthing went wrong" });
        }
        res.send({ result, auth: token });
    })
});

app.post("/login",verifyToken, async (req, res) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtkey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    res.send({ result: "somthing went wrong" });
                }
                res.send({ user, auth: token });
            })

        }
        else
            res.send({ result: "no user found" });
    }
    else {
        res.send({ result: "invalid login" });
    }
})

app.post('/add-product',verifyToken, async (req, res) => {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
})

app.get('/products',verifyToken, async (req, res) => {
    let products = await Product.find();
    if (products.length > 0) {
        res.send(products);
    }
    else {
        res.send({ result: "No products found" });
    }
})

app.delete('/product/:id',verifyToken, async (req, res) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);
})

app.get("/product/:id",verifyToken, async (req, res) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.send(result);
    } else {
        res.send({ result: "No record found." });
    }
})

app.put("/product/:id",verifyToken, async (req, res) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    res.send(result);
})

app.get("/search/:key", verifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }
        ]
    });
    res.send(result);
})
function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        console.log("middleware called", token);
        Jwt.verify(token, jwtkey, (err, valid) => {
            if (err) {
                res.status(401).send({ result: "please provide a valid token" });
            } else {
                next();
            }
        });
    } else {
        res.status(403).send({ result: "please add a token with the header" });
    }
}


app.listen(5000, () => {
    console.log("app started on  port 5000");
});