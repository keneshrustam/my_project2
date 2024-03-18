import axios from "axios";
import React, { createContext, useCallback, useReducer } from 'react';

import initialState from "./initialState";
import reducer from "./reducer";
import {TManga} from "../../../5shered/types/MangaTypes";
import {API_URL} from "../../../5shered/api/api";


export type TContextProps = {
    getData?: () => Promise<void>;
    addComment?: (newComment: any,id: string | number, clearForm :() => void) => Promise<void>
    regUser?: (email: string, password: string, Navigate: () => void) => Promise<void>;
    loginUser?: (email: string, password: string, Navigate: () => void, toggleReg: () => void) => Promise<void | string | undefined>;
    fastLoginUser?: (email: string, password: string) => Promise<void | string | undefined>;
    checkEmail?: (email: string) => Promise<void | string | undefined>;
}

export type TInitialState = {
    manga: TManga[];
    loading: boolean;
    error: any;
    user: {
        email: string;
        password: string;
        img: string;
        favoriteMangas: number[]
    } | null;

}

type user = {
    email: string,
    password:  string,
    id: number
}

interface users {
    users: user[]
}

export const AppContext = createContext<TInitialState & TContextProps>(initialState);

const Provider = ({ children }: React.PropsWithChildren) => {

    const [state, dispatch] = useReducer(reducer, initialState);

    const getData = useCallback(async () => {
        try {
            dispatch({ type: "getRequest" });
            const { data } = await axios.get(`${API_URL}/mangas`);
            dispatch({ type: "getSuccess", payload: data});
        } catch (error) {
            dispatch({ type: "getFailure", payload: error });
        }
    }, []);

    const addComment = useCallback(async (newComment: any, id: number | string, clearForm: () => void) => {
        try {
            dispatch({ type: "addRequest" });
            const { data: mangaItem } = await axios.get(`${API_URL}/mangas/${id}`);
            console.log(mangaItem)
            if (mangaItem && mangaItem.comments) {
                mangaItem.comments.push(newComment);
                await axios.put(`${API_URL}/mangas/${id}`, mangaItem);
                clearForm();
                dispatch({ type: "addSuccess" });
            } else {
                dispatch({ type: "getFailure", payload: "Манга не найдена или нет комментариев" });
            }
        } catch (error) {
            dispatch({ type: "getFailure", payload: error });
        }
    }, []);

    const checkEmail = useCallback(async (email: string) => {
        try {
            const { data: users } =  await axios.get(`${API_URL}/users`)
            return users.find((user : user) => user.email === email)
        } catch (error) {
            console.log(error)
        }
    },[])

    const regUser = useCallback(async (email: string, password: string, Navigate: () => void) => {
        try {
            const newUser = {
                email: email,
                password: password,
                favoriteMangas: []
            }
            const { data } = await axios.post(`${API_URL}/users`, newUser);
            dispatch({ type: "registerUser", payload: data});
            localStorage.setItem("user", JSON.stringify(newUser))
            Navigate()
        } catch (error) {
            dispatch({ type: "getFailure", payload: error });
        }
    }, []);


    const loginUser = useCallback(async (email: string, password: string, Navigate: () => void, toggleReg: () => void) => {
        try {
            const { data: users } = await axios.get(`${API_URL}/users`);

            const user: users = users.find((user : user) => user.email === email && user.password === password)

            if (user) {
                toggleReg();
                Navigate();
                localStorage.setItem("user", JSON.stringify({email: email,password:password}))
            } else {
                return "Проверьте Email на наличие ошибок или пароль";
            }

            dispatch({ type: "registerUser", payload: user });
        } catch (error) {
            dispatch({ type: "getFailure", payload: error });
        }
    }, []);

    const fastLoginUser = useCallback(async (email: string, password: string) => {
        try {
            const { data: users } = await axios.get(`${API_URL}/users`);

            const user: users = users.find((user : user) => user.email === email && user.password === password)

            if (user) {
                console.log("OK USER")
            } else {
                return "не балуйся с локалСтореж";
            }

            dispatch({ type: "registerUser", payload: user });
        } catch (error) {
            dispatch({ type: "getFailure", payload: error });
        }
    }, []);

    // create post request send data with formData

    const value: TInitialState & TContextProps = {
        manga: state.manga,
        loading: state.loading,
        error: state.error,
        addComment,
        getData,
        regUser,
        loginUser,
        fastLoginUser,
        checkEmail,
        user: state.user
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
export default Provider;
