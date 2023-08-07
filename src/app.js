require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

require("./db/conn");
const Register = require("./models/registers");
const {json} = require("express");
const { log } = require("console");

const port= process.env.PORT || 3015;
 
const static_path = path.join(__dirname, "../public");
const tempaltes_path = path.join(__dirname, "../templates/views");
partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", tempaltes_path);
hbs.registerPartials(partials_path)


app.get("/", (req,res) => {
    res.render("index");
});

app.get("/secret", auth, (req,res) => {
    res.render("secret");
});

app.get("/register", (req,res) => {
    res.render("register");
})

app.get("/login", (req,res) => {
    res.render("login");
})

app.get("/logout", auth, async (req,res) => {
    try{
        // Single Device Logout 
        req.user.tokens = req.user.tokens.filter((currentElement) => {
            return currentElement.token != req.token;
        })

        // Logout from all devices 
        // req.user.tokens = [];

        // Remove Token/Cookie 
        res.clearCookie("jwt");
        await req.user.save();
        res.render("login");
    }catch(error){
        res.status(500).send(error);
    }
});

app.post("/register", async (req,res) => {
    try{
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        if(password=== cpassword){
            const registerEmployee = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                age: req.body.age,
                password: password,
                confirmpassword: cpassword
            })

            const token = await registerEmployee.generateAuthToken();

            res.cookie("jwt", token, {
                expires:new Date(Date.now() + 670000),
                httpOnly:true
            });
            
            const registered = await registerEmployee.save();
            res.status(201).render("index");

        }else{
            res.send("Passwords does not match")
        }
    }catch(error){
        console.log("Registration error:", error);
        res.status(400).send(error);
    }
})

app.post("/login", async(req,res) => {
   try{
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await Register.findOne({email});

    const isMatch = await bcrypt.compare(password, useremail.password);

    const token = await useremail.generateAuthToken();

    res.cookie("jwt", token, {
        expires:new Date(Date.now() + 630000),
        httpOnly:true
    });

    if(isMatch){
        res.status(201).render("index");
    }else{
        res.send("Invalid Sign In");
    }
   } catch(error){
    res.status(400).send("Invalid SIgn In");
   }
});



app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
