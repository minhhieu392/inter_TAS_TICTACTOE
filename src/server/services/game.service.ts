import { Prisma, Game } from '@prisma/client';
import { prisma } from '../../config/postgres';

export const createPost = async (input: Prisma.GameCreateInput) => {
    return (await prisma.game.create({
        data: input,
    })) as Game;
};

export const findPost = async (
    where: Partial<Prisma.GameWhereInput>,
    select?: Prisma.GameSelect
) => {
    return (await prisma.game.findFirst({
        where,
        select,
    })) as Game;
};

export const findUniquePost = async (
    where: Prisma.GameWhereUniqueInput,
    select?: Prisma.GameSelect
) => {
    return (await prisma.game.findUnique({
        where,
        select,
    })) as Game;
};

export const findAllPosts = async (
    { page, limit, select }:
        {
            page: number,
            limit: number,
            select?: Prisma.GameSelect
        },
) => {
    const take = limit || 10;
    const skip = (page - 1) * limit
    return (await prisma.game.findMany({
        select,
        skip,
        take,
    })) as Game[];
};


export const updatePost = async (
    where: Partial<Prisma.GameWhereUniqueInput>,
    data: Prisma.GameUpdateInput,
    select?: Prisma.GameSelect
) => {
    return (await prisma.game.update({ where, data, select })) as Game;
};

export const deletePost = async (where: Prisma.GameWhereUniqueInput) => {
    return await prisma.game.delete({ where })
}

