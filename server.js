const express = require("express");
const mysql = require("mysql");
const multer = require('multer')
const path = require('path')
const cors = require("cors");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // https://www.npmjs.com/package/bcrypt npm i bcrypt
const  jwt = require('jsonwebtoken'); //https://github.com/auth0/node-jsonwebtoken npm install jsonwebtoken
const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 


const con = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "registration"
})
 
con.connect(function(err) {
    if(err) {
        console.log("Error in Connection");
    } else {
        console.log("Connected");
    }
})
 
app.get('/getEmployee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})
 
app.get('/get/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})
 
app.put("/update/:id", (req, res) => {
  const userId = req.params.id;
  const q = "UPDATE employee SET `name`= ?, `email`= ?, `salary`= ?, `address`= ? WHERE id = ?";
  
  const values = [
    req.body.name,
    req.body.email,
    req.body.salary,
    req.body.address,
  ];
  
  con.query(q, [...values,userId], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
    //return res.json({Status: "Success"})
  });
});
 
app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM employee WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "delete employee error in sql"});
        return res.json({Status: "Success"})
    })
})
 
app.get('/adminCount', (req, res) => {
    const sql = "Select count(id) as admin from users";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})
 
app.get('/employeeCount', (req, res) => {
    const sql = "Select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})
 
app.get('/salary', (req, res) => {
    const sql = "Select sum(salary) as sumOfSalary from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})
 
app.post('/create', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const address = req.body.address;
    const salary = req.body.salary;
  
    con.query("INSERT INTO employee (name, email, address, salary) VALUES (?, ?, ?, ?)", [name, email, address, salary], 
        (err, result) => {
            if(result){
                res.send(result);
            }else{
                res.send({message: "ENTER CORRECT DETAILS!"})
            }
        }
    )
})
 
app.get('/hash', (req, res) => { 
    bcrypt.hash("123456", 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            hash
        ]
        return res.json({result: hash});
    } )
})
 
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM employee Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response)=> {
                if(err) return res.json({Error: "password error"});
                if(response) {
                    const token = jwt.sign({role: "admin"}, "jwt-secret-key", {expiresIn: '1d'});
                    return res.json({Status: "Success", Token:token})
                } else {
                    return res.json({Status: "Error", Error: "Wrong Email or Password"});
                }
            })
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})
 
app.post('/register',(req, res) => {
    const sql = "INSERT INTO employee (`name`,`email`,`password`) VALUES (?)"; 
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            req.body.name,
            req.body.email,
            hash,
        ]
        con.query(sql, [values], (err, result) => {
            if(err) return res.json({Error: "Error query"});
            return res.json({Status: "Success"});
        })
    } )
})
 

// malter images 

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      return cb(null, "./public/images")
    },
    filename: function (req, file, cb) {
      return cb(null, `${Date.now()}_${file.originalname}`)
    }
  })
   
  const upload = multer({storage})
   
  //app.post('/upload', upload.single('file'), (req, res) => {
  //  console.log(req.body)
  //  console.log(req.file)
  //  return res.json({Status: "Success"});
  //})
   
  app.post('/create',upload.single('file'), (req, res) => {
      const sql = "INSERT INTO employee (`name`,`email`,`address`, `salary`,`image`) VALUES (?)"; 
      const values = [
          req.body.name,
          req.body.email,
          req.body.address,
          req.body.salary, 
          req.file.filename
      ]
      con.query(sql, [values], (err, result) => {
          if(err) return res.json({Error: "Error singup query"});
          return res.json({Status: "Success"});
      })
  })
const PORT = 8080
app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
  })


