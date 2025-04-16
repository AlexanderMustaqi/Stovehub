create database softeng2025;
use softeng2025;

/*USER RELEVANT TABLES*/
create table user_base(
	user_id smallint(5) auto_increment primary key,
    username varchar(50) not null,
    password varchar(50) not null,
    email varchar(50) not null unique
);

create table user_admin(
	ua_id smallint(5) auto_increment primary key,
    profile_pic text not null,
    bio text not null,
    user_id smallint(5) not null,
    FOREIGN KEY (user_id) references user_base(user_id) ON DELETE CASCADE
);
create table user_chef(
	uc_id smallint(5) auto_increment primary key,
    profile_pic text not null,
    bio text not null,
    user_id smallint(5) not null,
    FOREIGN KEY (user_id) references user_base(user_id) ON DELETE CASCADE
);
create table user_registered(
	ur_id smallint(5) auto_increment primary key,
    profile_pic text not null,
    bio text not null,
    user_id smallint(5) not null,
    FOREIGN KEY (user_id) references user_base(user_id) ON DELETE CASCADE
);
create table followers(
	follower_id smallint(5) auto_increment primary key,
    main_user_id smallint(5) not null,
    secondary_user_id smallint(5) not null,
    foreign key (main_user_id) references user_base(user_id) ON DELETE CASCADE,
    foreign key (secondary_user_id) references user_base(user_id) ON DELETE CASCADE
);
create table notifications(
	notification_id smallint(5) auto_increment primary key,
    notification text,
    user_id smallint(5) not null,
    foreign key (user_id) references user_base(user_id) ON DELETE CASCADE
);

/*GALLERY RELEVANT TABLES*/
create table gallery(
	gallery_id smallint(5) auto_increment primary key,
    recipe_id smallint(5) not null,
    user_id smallint(5) not null,
    foreign key (recipe_id) references recipe(recipe_id) ON DELETE CASCADE,
    foreign key (user_id) references user_base(user_id)ON DELETE CASCADE
);

create table recipe(
	recipe_id smallint(5) auto_increment primary key,
    imageUrl varchar(255), /*Stores the path/URL to the image file*/
    recipe_name varchar(5) not null,
    description text not null,
    likes int,
    dislikes int,
    user_id smallint(5) not null,
    foreign key (user_id) references user_base(user_id) ON DELETE CASCADE
);

create table recipe_comment(
	comment_id smallint(5) auto_increment primary key,
    comment_string text not null,
    commentator smallint(5) not null,
    recipe_id smallint(5) not null,
    foreign key (commentator) references user_base(user_id) ON DELETE CASCADE,
    foreign key (recipe_id) references recipe(recipe_id) ON DELETE CASCADE
);

create table ingredient(
	ing_id smallint(5) auto_increment primary key,
    ing_name varchar(5) not null,
    calories int,
    protein int,
    carbs int,
    fats int
);
create table recipe_ing(
	ri_id smallint(5) auto_increment primary key,
    amount int,
    recipe_id smallint(5) not null,
	ing_id smallint(5) not null,
    foreign key (recipe_id) references recipe(recipe_id) ON DELETE CASCADE,
    foreign key (ing_id) references ingredient(ing_id) ON DELETE CASCADE
);

create table cart(
	cart_id smallint(5) auto_increment primary key,
    user_id smallint(5) not null,
    foreign key (user_id) references user_base(user_id) ON DELETE CASCADE 
);

create table cart_ing(
	ci_id smallint(5) auto_increment primary key,
    amount int,
    cart_id smallint(5) not null,
    ing_id smallint(5) not null,
    foreign key (cart_id) references cart(cart_id) ON DELETE CASCADE,
    foreign key (ing_id) references ingredient(ing_id) ON DELETE CASCADE
);

/*CHAT RELEVANT TABLES*/

create table chat(
	chat_id smallint(5) auto_increment primary key
);

create table chat_user(
	cu_id smallint(5) auto_increment primary key,
    chat_id smallint(5) not null,
    user_id smallint(5) not null,
    foreign key (chat_id) references chat(chat_id) ON DELETE CASCADE,
    foreign key (user_id) references user_base(user_id) ON DELETE CASCADE
);

create table message(
	message_id smallint(5) auto_increment primary key,
    message_date date,
	user_id smallint(5) not null,
    chat_id smallint(5) not null,
    foreign key (user_id) references user_base(user_id) ON DELETE CASCADE,
    foreign key (chat_id) references chat(chat_id) ON DELETE CASCADE
);

create table message_string(
	ms_id smallint(5) auto_increment primary key,
    message varchar(255),
    message_id smallint(5) not null,
    foreign key (message_id) references message(message_id) ON DELETE CASCADE
);

create table message_img(
	mi_id smallint(5) auto_increment primary key,
    message_img varchar(255), /*MESSAGE IMG URL*/
    message_id smallint(5) not null,
    foreign key (message_id) references message(message_id) ON DELETE CASCADE
);	