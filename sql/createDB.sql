CREATE TABLE `product` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`vendor` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`code` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`catalogName` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`urlDescription` VARCHAR(300) NOT NULL COLLATE 'utf8_general_ci',
	`urlPicture` VARCHAR(300) NOT NULL COLLATE 'utf8_general_ci',
	`name` VARCHAR(300) NOT NULL COLLATE 'utf8_general_ci',
	`country` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
	`brand` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
	`productType` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
	`productCategory` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_general_ci',
	`specification` JSON NULL DEFAULT NULL,
	`dateCreated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`dateUpdated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `vendor` (`vendor`) USING BTREE,
	INDEX `country` (`country`) USING BTREE,
	INDEX `code` (`code`) USING BTREE,
	INDEX `catalogName` (`catalogName`) USING BTREE
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=8378
;



CREATE TABLE `pricetag` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`productId` INT(11) NOT NULL DEFAULT '0',
	`priceDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `priceDate` (`priceDate`) USING BTREE,
	INDEX `FK_wineprice_wine` (`productId`) USING BTREE,
	CONSTRAINT `FK_wineprice_wine` FOREIGN KEY (`productId`) REFERENCES `wineprice`.`product` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=1357
;

CREATE TABLE `pricedetail` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`priceTagId` INT(11) NOT NULL DEFAULT '0',
	`measure` VARCHAR(50) NOT NULL DEFAULT '0' COLLATE 'utf8_general_ci',
	`price` INT(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `priceTagId` (`priceTagId`) USING BTREE,
	CONSTRAINT `FK_pricedetail_pricetag` FOREIGN KEY (`priceTagId`) REFERENCES `wineprice`.`pricetag` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=885
;


