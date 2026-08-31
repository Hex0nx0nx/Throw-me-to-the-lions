<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Throw Me to the Lions</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #000;
      color: #e8e8e8;
      font-family: Arial, Helvetica, sans-serif;
      height: 100vh;
      overflow: hidden;
    }

    main {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }

    h1 {
      font-size: clamp(2rem, 6vw, 6rem);
      font-weight: 300;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .album {
      margin-top: 24px;
      font-size: clamp(.8rem, 1.2vw, 1rem);
      letter-spacing: .45em;
      text-transform: uppercase;
      opacity: .45;
    }

    .status {
      position: absolute;
      bottom: 30px;
      font-size: .65rem;
      letter-spacing: .35em;
      text-transform: uppercase;
      opacity: .25;
    }
  </style>
</head>

<body>

  <main>
    <h1>Throw Me to the Lions</h1>

    <div class="album">
      The Cost of Continuity
    </div>

    <div class="status">
      Transmission Pending
    </div>
  </main>

</body>
</html>
