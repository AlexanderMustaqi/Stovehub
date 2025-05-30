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
    gallery_name varchar(50) not null,
    gallery_image_url varchar(512) not null,
    user_id smallint(5) not null,
    foreign key (user_id) references user_base(user_id)ON DELETE CASCADE
);

create table gal_rec (
	id int primary key auto_increment,
    gallery_id int not null,
    recipe_id int not null,
    foreign key(gallery_id) references gallery(gallery_id) on delete cascade,
    foreign key(recipe_id) references recipes(id) on delete cascade
);

CREATE TABLE recipes (
  id int(11) NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  difficulty enum('easy','medium','hard') DEFAULT 'medium',
  prep_time_value int(11) NOT NULL,
  prep_time_unit enum('minutes','hours') DEFAULT 'minutes',
  category enum('appetizer','main','dessert') DEFAULT 'main',
  ingredients longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`ingredients`)),
  image_url varchar(512) DEFAULT NULL,
  created_at datetime DEFAULT current_timestamp(),
  posted_by varchar(25) NOT NULL,
  PRIMARY KEY (`id`)
);

create table recipe_comment(
	comment_id smallint(5) auto_increment primary key,
    comment_string text not null,
    commentator smallint(5) not null,
    recipe_id smallint(5) not null,
    foreign key (commentator) references user_base(user_id) ON DELETE CASCADE,
    foreign key (recipe_id) references recipe(recipe_id) ON DELETE CASCADE
);

create table recipe_reactions(
	id int primary key auto_increment,
    recipe_id int not null,
    user_id smallint(5) not null,
    reaction enum('like','dislike') not null,
    created_at datetime default current_timestamp(),
    foreign key(recipe_id) references recipes(id) on delete cascade,
    foreign key(user_id) references user_base(user_id) on delete cascade
);

describe recipe_reactions;

create table cart(
	cart_id smallint(5) auto_increment primary key,
    user_id smallint(5) not null,
    foreign key (user_id) references user_base(user_id) ON DELETE CASCADE 
);

/*CHAT RELEVANT TABLES*/

create table chat(
	chat_id smallint(5) auto_increment primary key,
    chat_name varchar(50) not null,
    chat_settings int 
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
    message_date date default current_timestamp,
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