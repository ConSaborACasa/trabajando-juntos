<?php
// Función para validar un correo electrónico
function validarCorreo($correo) {
    // Filtrar el correo usando filter_var
    return filter_var($correo, FILTER_VALIDATE_EMAIL);
}

// Función para validar el número de celular
function validarNumeroCelular($numeroCelular) {
    // Remover todos los caracteres no numéricos
    $numeroCelular = preg_replace("/[^0-9]/", "", $numeroCelular);
    // Verificar que tenga al menos 12 dígitos
    return strlen($numeroCelular) >= 12;
}

// Función para limpiar y validar los datos del formulario
function limpiarYValidarDatos($nombreCompleto, $correo, $numeroCelular) {
    // Limpiar y validar nombre completo
    if (empty($nombreCompleto)) {
        throw new Exception("El nombre completo es requerido.");
    }

    // Validar correo electrónico
    if (!validarCorreo($correo)) {
        throw new Exception("El correo electrónico no es válido.");
    }

    // Validar número de celular
    if (!validarNumeroCelular($numeroCelular)) {
        throw new Exception("El número de celular debe contener al menos 12 dígitos numéricos.");
    }
}

// Verificar si se recibieron datos del formulario por POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // Obtener y limpiar datos del formulario
        $nombreCompleto = htmlspecialchars(trim($_POST["nombreCompleto"]));
        $correo = htmlspecialchars(trim($_POST["correo"]));
        $numeroCelular = htmlspecialchars(trim($_POST["numeroCelular"]));

        // Limpiar y validar los datos del formulario
        limpiarYValidarDatos($nombreCompleto, $correo, $numeroCelular);

        // Obtener el contenido actual de usuarios.json
        $usuariosJSON = file_get_contents("../usuarios.json");

        // Decodificar el JSON a un array de usuarios existentes
        $usuarios = json_decode($usuariosJSON, true);

        // Verificar si el correo electrónico o el número de celular ya están registrados
        foreach ($usuarios as $usuarioExistente) {
            if ($usuarioExistente['correo'] == $correo) {
                throw new Exception("El correo electrónico ya está registrado.");
            }
            if ($usuarioExistente['numeroCelular'] == $numeroCelular) {
                throw new Exception("El número de celular ya está registrado.");
            }
        }

        // Formar el array de usuario
        $usuario = [
            "nombreCompleto" => $nombreCompleto,
            "correo" => $correo,
            "numeroCelular" => $numeroCelular
        ];

        // Agregar el nuevo usuario al array de usuarios
        $usuarios[] = $usuario;

        // Codificar el array de usuarios a JSON
        $usuariosJSON = json_encode($usuarios, JSON_PRETTY_PRINT);

        // Guardar el JSON actualizado de usuarios en el archivo usuarios.json
        file_put_contents("../usuarios.json", $usuariosJSON);

        // Redireccionar al index.html después de guardar el usuario
        header("Location: index.html");
        exit();
    } catch (Exception $e) {
        // Capturar cualquier excepción y mostrar un mensaje de error
        die("Error: " . $e->getMessage());
    }
}
?>
