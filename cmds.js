/**
 * Created by marta on 28/02/2018.
 */

const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');



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
    models.quiz.findAll()
        .then(quizzes => {
            quizzes.forEach(quiz => {
                log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
            });
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Esta función devuelve una promesa que:
 *  -Valida que se ha introducido un valor para el parámetro
 *  -Convierte el parámetro en un número entero
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 *
 * @param id Parametro con el índice a validar
 */
const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
            id = parseInt(id); //coger la parte entera y desacartar lo demás
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`))
            } else {
                resolve(id);
            }
        }
    });
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 * @param rl Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id)  => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido
 *          .then(answer => {...})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio y final
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usuario
 */
const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
       rl.question(colorize(text, 'red'), answer => {
           resolve(answer.trim());
       });
    });
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
   makeQuestion(rl, 'Introduzca una pregunta: ')
       .then(q => {
           return makeQuestion(rl, 'Introduzca la respuesta: ')
           .then(a => {
               return {question: q, answer: a};
           });
       })
       .then(quiz => {
           return models.quiz.create(quiz);
       })
       .then((quiz) => {
           log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')}: ${quiz.answer}`);
       })
       .catch(Sequelize.ValidationError, error => {
           errorlog('El quiz es erróneo: ');
           error.errors.forEach(({message}) => errorlog(message));
       })
       .catch(error => {
           errorlog(error.message);
       })
       .then(() => {
           rl.prompt();
       });
};

/**
 *Borra un quiz del modelo
 *
 * @param id Clave del quiz a borrar en el modelo
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.deleteCmd = (rl,id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 *Edita un quiz del modelo
 *
 * @param id Clave del quiz a editar en el modelo
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.editCmd = (rl,id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(rl, 'Introduzca la pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
            return makeQuestion(rl, 'Introduzca la respuesta: ')
            .then(a => {
                quiz.question = q;
                quiz.answer =a;
                return quiz;
            });
        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 *Prueba un quiz; es decir, hace una pregunta del modelo a la que debemos contestar
 *
 * @param id Clave del quiz a probar
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.testCmd = (rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
            return makeQuestion(rl, quiz.question +'? ')
                .then(a => {
                    if(quiz.answer.toUpperCase() === a.toUpperCase().trim()){
                        log("Su respuesta es correcta");
                        biglog('Correcta', 'green');
                    } else{
                        log("Su respuesta es incorrecta");
                        biglog('Incorrecta', 'red');
                    }
                });

        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


/**
 *Pregunta todos los quizzes existentes en el modelo en orden aleatorio
 * Se gana si se contesta a todos satisfactoriamente
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.playCmd = (rl) => {
    let score = 0;
    let toBeResolved = [];

    const playOne = () => {
        return new Promise((resolve, reject) => {

            if (toBeResolved.length <= 0) {
                console.log("No hay nada mas que preguntar.\nFin del examen. Aciertos:");
                resolve();
                return;
            }
            let pos = Math.floor(Math.random() * toBeResolved.length);
            let quiz = toBeResolved[pos];
            toBeResolved.splice(pos, 1);

            makeQuestion(rl, quiz.question + '? ')
                .then(answer => {
                    if (answer.toUpperCase().trim() === quiz.answer.toUpperCase().trim()) {
                        score++;
                        console.log('CORRECTO - Lleva ', score, ' aciertos');
                        resolve(playOne());
                    } else {
                        console.log('INCORRECTO');
                        console.log('Fin del juego. Aciertos: '+ score);
                        resolve();
                    }
                })
        })
    }
    models.quiz.findAll({raw: true})
        .then(quizzes => {
            toBeResolved = quizzes;
        })
        .then(() => {
            return playOne();
        })
        .catch(error => {
            console.log(error);
        })
        .then(() => {
            biglog(score,'magenta');
            rl.prompt();
        })
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