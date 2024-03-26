import axios from 'axios';
import { prismaClient } from '../../clients/db';
import JWTService from '../../services/jwt';

interface GoogleTokenResult {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}

const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const googleToken = token;
        const googleOauthUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauthUrl.searchParams.set('id_token', googleToken);

        const response = await axios.get<GoogleTokenResult>(googleOauthUrl.toString(), {
            responseType: 'json',
        });

        const data = response.data;

        const user = await prismaClient.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            await prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageUrl: data.picture, 
                },
            });
        }

        const userInDb = await prismaClient.user.findUnique({ where: { email: data.email }});
        if(!userInDb) throw new Error('User not found')
        const userToken = await JWTService.generateTokenForUser(userInDb);

        
        return userToken;
    },
};

export const resolvers = { queries };
