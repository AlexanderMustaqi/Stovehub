DELIMITER //

//

CREATE procedure postMessage(message varchar(255), user_id smallint(5), chat_id smallint(5))

BEGIN
	
    declare exit handler for sqlexception /*Defining an error handler incase an error occures to ensure relational data stays safe*/
    
    BEGIN /*Handler cody*/ 
		ROLLBACK; /*Cancel transaction*/
        RESIGNAL; /*Throw err to caller*/
	END;
    
	START transaction; /*Using Transaction to ensure the integrity of the relational data*/
    
		insert into message(user_id, chat_id) value (user_id, chat_id);
		SET @last_id = last_insert_id();
		insert message_string(message, message_id) value (message, @last_id);
	
    COMMIT; 
END //

create procedure postRegisteredUser(username varchar(50), password varchar(50), email varchar(50))

BEGIN

	declare exit handler for sqlexception /*Defining an error handler incase an error occures to ensure relational data stays safe*/
    
    BEGIN /*Handler cody*/ 
		ROLLBACK; /*Cancel transaction*/
        RESIGNAL; /*Throw err to caller*/
	END;
    
    START transaction; /*Using Transaction to ensure the integrity of the relational data*/
    
		insert into user_base(username, password, email) value (username, password, email);
	
    COMMIT;

END //

DELIMITER ;

drop procedure postRegisteredUser; 
call postMessage('This is a test message! Using postMessage() procedure!', 1, 1);

