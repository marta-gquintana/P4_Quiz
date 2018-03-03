/**
 * Created by marta on 28/02/2018.
 */

const {log, biglog, errorlog, colorize} = require("./out");
const model = require('./model');



/**
 * Muestra la ayuda
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.helpCmd = rl => {
    log("Comandos:");
    log("h|help - Muestra esta ayuda.");
    log("list - Lista los quizzes existentes.");
    log("show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log("add - Añade un nuevo quiz interactivamente.");
    log("delete <id> - Borra el quiz indicado.");
    log("edit <id> - Edita el quiz indicado.");
    log("test <id> - Prueba el quiz indicado.");
    log("p|play - Juega a preguntar aleatoriamente todos los quizzes.");
    log("credits - Créditos");
    log("q|quit - Sale del programa.");
    rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.listCmd = rl => {
    model.getAll().forEach((quiz, id) => {
        log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id)  => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 *Añade un nuevo quiz al modelo
 *Pregunta interactivamente por la pregunta y por la respuesta
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario;
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.addCmd = rl => {
    rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize('Introduzca la respuesta: ', 'red'), answer => {
            model.add(question, answer);
            log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer} `);
            rl.prompt();
        });
    });
};

/**
 *Borra un quiz del modelo
 *
 * @param id Clave del quiz a borrar en el modelo
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.deleteCmd = (rl,id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 *Edita un quiz del modelo
 *
 * @param id Clave del quiz a editar en el modelo
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.editCmd = (rl,id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                rl.question(colorize('Introduzca una respuesta: ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 *Prueba un quiz; es decir, hace una pregunta del modelo a la que debemos contestar
 *
 * @param id Clave del quiz a probar
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.testCmd = (rl,id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(colorize(quiz.question + '? ', 'magenta'), resp => {
                if (resp === quiz.answer){
                    biglog('Correcto', 'green');
                    rl.prompt();
                } else {
                    biglog('Incorrecto', 'red');
                    rl.prompt();
                }
            });


        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 *Pregunta todos los quizzes existentes en el modelo en orden aleatorio
 * Se gana si se contesta a todos satisfactoriamente
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.playCmd = rl => {
    let score = 0;
    let toBeResolved = new Array();
    for (i=0; i<model.count(); i++) {
        toBeResolved[i]=i;
    }
    const playOne = () => {
        if (toBeResolved.length === 0) {
            log(`Fin del juego. Aciertos: ` + score);
            biglog(score, 'red');
            rl.prompt();
        } else {
            let id = Math.floor(Math.random()*(toBeResolved.length));
            toBeResolved.splice(id,1);
            let quiz = model.getByIndex(id);
            rl.question(colorize(quiz.question + '? ', 'magenta'), resp => {
                if (resp === quiz.answer) {
                    score++;
                    log(`Llevas: ` + score + ` aciertos`);
                    playOne();
                } else {
                    log(`Fin del examen. Aciertos: `+ score);
                    biglog(score, 'red');
                    rl.prompt();

                }
            });
        }
    };
    playOne();
};

/**
 *Muestra los nombres de los autores de la práctica
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.creditsCmd = rl => {
    log("Autores de la práctica:");
    log("MARTA",'green');
    rl.prompt();
};

/**
 *Terminar el programa
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.quitCmd = rl => {
    rl.close();
};