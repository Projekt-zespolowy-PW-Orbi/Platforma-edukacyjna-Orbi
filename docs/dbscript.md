```sql
CREATE DATABASE IF NOT EXISTS orbi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_polish_ci;

USE orbi;

-- =========================
-- CONCEPTS
-- =========================
CREATE TABLE concept (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_concept_name (name)
) ENGINE=InnoDB;

-- relacja parent -> child między pojęciami
CREATE TABLE concept_group (
    parent_concept_id INT UNSIGNED NOT NULL,
    child_concept_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (parent_concept_id, child_concept_id),
    KEY idx_concept_group_child (child_concept_id),

    CONSTRAINT fk_concept_group_parent
        FOREIGN KEY (parent_concept_id)
        REFERENCES concept(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_concept_group_child
        FOREIGN KEY (child_concept_id)
        REFERENCES concept(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_concept_group_not_self
        CHECK (parent_concept_id <> child_concept_id)
) ENGINE=InnoDB;

-- =========================
-- SENTENCES
-- =========================
CREATE TABLE sentence (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    content TEXT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- powiązanie zdania z pojęciem
CREATE TABLE sentence_concept (
    sentence_id INT UNSIGNED NOT NULL,
    concept_id INT UNSIGNED NOT NULL,
    is_true bool NOT NULL DEFAULT 1,

    PRIMARY KEY (sentence_id, concept_id),
    KEY idx_sentence_concept_concept (concept_id),

    CONSTRAINT fk_sentence_concept_sentence
        FOREIGN KEY (sentence_id)
        REFERENCES sentence(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sentence_concept_concept
        FOREIGN KEY (concept_id)
        REFERENCES concept(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- ALGORITHMS
-- =========================
CREATE TABLE algorithm (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_algorithm_name (name)
) ENGINE=InnoDB;

-- krok jako encja współdzielona między algorytmami
CREATE TABLE step (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    content TEXT NULL,
    algorithm_id INT UNSIGNED NULL,
    PRIMARY KEY (id)
    
    CONSTRAINT fk_algorithm_step_referenced_algorithm
		FOREIGN KEY (algorithm_id)
		REFERENCES algorithm(id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE
) ENGINE=InnoDB;

-- kolejność kroków w algorytmie
CREATE TABLE algorithm_step (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    algorithm_id INT UNSIGNED NOT NULL,
    step_id INT UNSIGNED NOT NULL,
    order_number INT UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_algorithm_step_order (algorithm_id, order_number),
    KEY idx_algorithm_step_step (step_id),

    CONSTRAINT fk_algorithm_step_algorithm
        FOREIGN KEY (algorithm_id)
        REFERENCES algorithm(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_algorithm_step_step
        FOREIGN KEY (step_id)
        REFERENCES step(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;
```