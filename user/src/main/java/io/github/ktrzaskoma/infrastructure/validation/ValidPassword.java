package io.github.ktrzaskoma.infrastructure.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    String message() default "Hasło musi zawierać minimum 8 znaków, jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}







