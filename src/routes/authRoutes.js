import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

// Register a new user endpoint /auth/register
router.post('/register', (req, res) => {
	const { username, password } = req.body
	
	// Encrypt the password
	const hashedPassword = bcrypt.hashSync(password, 8)
	
	// Save the new user and hashed password to the database
	try {
		// Add a new user
		const insertUser = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`)
		const result = insertUser.run(username, hashedPassword)
		
		// Assign a default TODO to the user
		const defaultTodo = `Hello! Add your first todo!`
		const insertTodo = db.prepare(`INSERT INTO todos (user_id, task) VALUES (?, ?)`)
		insertTodo.run(result.lastInsertRowid)
		
		// create a token for authenticating the user
		const token = jwt.sign({id: result.id}, process.env.JWT_SECRET, {expiresIn: '24h'})
		res.json({ token })

	} catch (error) {
		console.log(err.message)	
		res.sendStatus(503)
	}
})

router.post('/login', (req, res) => {

	const {username, password} = req.body

	try{
		const getUser = db.prepare('SELECT * FROM users WHERE username = ?')
		const user = getUser.get(username)
		
		// If the user is not found, return status "404" 
		if(!user) {return res.status(404).send({message:"User not found"})}
		
		// Compare the password with hashed entries on the database
		const passwordIsValid = bcrypt.compareSync(password, user.password)

		// If no entries on the database where found, return "Invalid Password" and exit the function
		if(!passwordIsValid) {return res.status(401).send({message:"Invalid Password"})}
		console.log(user)	

		// If password is found, authentication is sucessfull!
		const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {
			expiresIn: '24h'})
		res.json({token})
	} catch (err) {
		console.log(err.message)
		res.sendStatus(503)
	}
})

export default router