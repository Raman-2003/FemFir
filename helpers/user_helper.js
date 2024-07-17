const nodemailer = require('nodemailer');
const argon2 = require('argon2');

//email Verification
const verifyEmail = async(email)=> {
    try{
       const  otp = generateOtp();
        console.log(otp);
        console.log(email);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host:'smpt.gmail.com',
            port: 567,
            secure:false,

            auth:{
                user:'krishbiden441@gmail.com',
                pass: 'hgzxztlcdhdackts'
            }

        })

        const mailOptions = {
            from: 'krishbiden441@gmail.com',
            to: email,
            subject: 'For Verification',
            text: `Welcome to Female First ! This is the OTP for Signup: ${otp}`
        }

        transporter.sendMail(mailOptions,(error)=>{
            if(error){
                console.log(error);
            }else{
                console.log('Email has been sent successfully');
            }
        })
        return otp
    }
    catch(error){
        console.log(error);
    }
}

//Generate OTP
var generateOtp = ()=> {
   var otp = `${Math.floor(1000 + Math.random() * 9000)}`      
    return otp 
}


//password hashing using argon2 module.
const hashpassword = async(password)=>{
    try{
        const passwordhash = await argon2.hash(password)
        return passwordhash
    }
    catch(error){
        console.log(error);
    }
}


module.exports = {
    verifyEmail,
    generateOtp,
    hashpassword
}

