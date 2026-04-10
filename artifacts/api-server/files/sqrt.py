def sqrt(x, tolerance=1e-10, max_iterations=100):
    if x < 0:
        return ("Not Today, Thank You!")
    if x == 0:
        return 0

    guess = x / 2.0
    for i in range(max_iterations):
        next_guess = (guess + x / guess) / 2
        if abs(next_guess - guess) < tolerance:
            return next_guess
        guess = next_guess
    return guess

print(sqrt(int(input('Enter number: '))))
