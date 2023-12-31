import {NextFunction, Request, Response} from "express";
import jwt, {Secret} from "jsonwebtoken";
import {catchAsyncHandler} from "../../middleware/catchAsyncHandler";
import {iActivationRequest, iUser} from "../../types/auth.type";
import ErrorHandler from "../../utils/ErrorHandler";
import userModel from "./user.model";

export const activateUser = catchAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // get activation code from body
            const {activation_code} = req.body as iActivationRequest;

            // get verification code from cookie
            const verification_token = req.cookies.verification_token;

            const newUser: {user: iUser; activationCode: string} = jwt.verify(
                verification_token,
                process.env.JWT_SECRET as Secret
            ) as {user: iUser; activationCode: string};

            if (newUser.activationCode !== activation_code)
                return next(new ErrorHandler("Invalid activation code", 400));

            const {name, email, password} = newUser.user;
            const existUser = await userModel.findOne({email});
            if (existUser)
                return next(new ErrorHandler("Already exist user", 404));

            await userModel.create({
                name,
                email,
                password,
            });

            res.status(201).json({
                success: true,
                message: "account created successfully and activated!",
            });
        } catch (error) {}
    }
);
