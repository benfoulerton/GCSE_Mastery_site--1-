"""Physics 4.2.1 pilot: current, potential difference and resistance. Written from the specification and study aids in data/physics.json."""
L = lambda g, n: 'P-4.2.1.%d-LO%02d' % (g, n)
CARDS = [
 ('understand', [2], [L(2,1)], 'What is needed for charge to flow round a closed circuit?', 'A source of potential difference, such as a cell or battery.'),
 ('define', [2], [L(2,2)], 'What is electric current?', 'The rate of flow of electric charge.'),
 ('define', [2], [L(2,3)], 'Write the charge flow equation with units.', 'Charge flow (C) = current (A) × time (s), or Q = I t.'),
 ('calc', [2], [L(2,3)], 'A current of 2 A flows for 30 s. How much charge flows?', 'Q = I t = 2 × 30 = 60 C.'),
 ('calc', [2], [L(2,3)], 'A current of 0.5 A flows for 2 minutes. How much charge flows?', '2 min = 120 s, so Q = 0.5 × 120 = 60 C.'),
 ('fact', [2], [L(2,4)], 'In a series circuit, how does the current at different points compare?', 'It is the same at every point in a single closed loop.'),
 ('define', [3], [L(3,3)], 'Write the equation linking potential difference, current and resistance.', 'Potential difference (V) = current (A) × resistance (Ω), or V = I R.'),
 ('calc', [3], [L(3,3)], 'A 12 V battery is connected to a 4 Ω resistor. What is the current?', 'I = V ÷ R = 12 ÷ 4 = 3 A.'),
 ('calc', [3], [L(3,3)], 'A component has 6 V across it and carries 0.5 A. What is its resistance?', 'R = V ÷ I = 6 ÷ 0.5 = 12 Ω.'),
 ('understand', [3], [L(3,1)], 'For a given potential difference, what happens to the current if the resistance increases?', 'The current decreases, because current = potential difference ÷ resistance.'),
 ('define', [4], [L(4,2)], 'What is an ohmic conductor? Describe its I–V graph.', 'A resistor whose resistance stays constant at constant temperature. The graph is a straight line through the origin.'),
 ('fact', [4], [L(4,4)], 'What happens to the resistance of a filament lamp as it gets hotter?', 'It increases, so the I–V graph curves (current rises less steeply).'),
 ('fact', [4], [L(4,5)], 'How does a diode behave?', 'Current flows in one direction only. In the other direction its resistance is very high.'),
 ('fact', [4], [L(4,6)], 'How does the resistance of a thermistor change with temperature?', 'It decreases as temperature increases.'),
 ('fact', [4], [L(4,8)], 'How does the resistance of an LDR change with light?', 'It decreases as light intensity increases.'),
]
def mc(g, los, d, q, opts, a, ex): return dict(refs=['4.2.1.%d' % x for x in g], los=los, d=d, q=q, opts=opts, a=a, ex=ex)
QS = [
 mc([2],[L(2,2)],1,'Electric current is best defined as…',['the energy transferred by a circuit','the rate of flow of charge','the push that makes charge flow','how much a component resists flow'],1,['That is closer to power.','Correct. Current is the rate of flow of charge.','That is potential difference.','That is resistance.']),
 mc([2],[L(2,3)],2,'A current of 3 A flows for 20 s. How much charge flows?',['0.15 C','6.7 C','23 C','60 C'],3,['That divides 3 by 20 the wrong way.','That divides 20 by 3. The equation is Q = I t.','That adds the numbers.','Correct. Q = 3 × 20 = 60 C.']),
 mc([3],[L(3,3)],2,'A 9 V battery is connected across a 3 Ω resistor. What current flows?',['27 A','3 A','0.33 A','6 A'],1,['That multiplies V and R; current = V ÷ R.','Correct. I = 9 ÷ 3 = 3 A.','That is R ÷ V.','That subtracts, which is not in the equation.']),
 mc([3],[L(3,3)],2,'A resistor has a current of 0.2 A when the potential difference is 5 V. What is its resistance?',['1 Ω','0.04 Ω','25 Ω','4.8 Ω'],2,['That is 5 × 0.2.','That is 0.2 ÷ 5. Resistance = V ÷ I.','Correct. R = 5 ÷ 0.2 = 25 Ω.','That subtracts, which is not in the equation.']),
 mc([4],[L(4,2)],1,'What does the I–V graph of an ohmic conductor at constant temperature look like?',['A curve that levels off','A straight line through the origin','A horizontal line','A curve that gets steeper'],1,['That is not ohmic behaviour.','Correct. Current is directly proportional to potential difference.','A horizontal line would mean current does not change.','That describes some non-ohmic components.']),
 mc([4],[L(4,4)],2,'Why does the resistance of a filament lamp increase as the current increases?',['The wire gets longer','The filament heats up','The potential difference falls','The lamp gets brighter, which adds charge'],1,['The wire does not lengthen noticeably.','Correct. A hotter filament has more resistance, so the graph curves.','The potential difference does not fall.','Brightness does not add charge.']),
 mc([4],[L(4,5)],1,'Which component allows current to flow in only one direction?',['Thermistor','Diode','LDR','Fixed resistor'],1,['A thermistor changes resistance with temperature.','Correct. A diode conducts one way only.','An LDR changes with light.','A fixed resistor conducts both ways.']),
 mc([4],[L(4,6)],2,'As the temperature of a thermistor increases, its resistance…',['increases','decreases','stays the same','becomes infinite'],1,['That is the pattern for a metal wire.','Correct. A thermistor\'s resistance falls as it gets hotter.','It changes, which is why it is useful in sensors.','That describes a diode in reverse.']),
 mc([4],[L(4,8)],2,'An LDR is placed in bright light. What happens to its resistance?',['It increases','It decreases','It stays constant','It reverses direction'],1,['That is what happens in the dark.','Correct. Resistance falls as light intensity rises.','It changes with light.','Resistance has no direction.']),
]
