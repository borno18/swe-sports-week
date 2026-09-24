import { test } from 'node:test';
import assert from 'node:assert/strict';
import { volunteerAssignments, getUniqueVolunteers } from '../lib/volunteers-data.ts';

test('volunteer assignments list has exact 15 tournament sports and matches outdoor/indoor split', () => {
  assert.equal(volunteerAssignments.length, 15);

  const outdoor = volunteerAssignments.filter(v => v.category === 'Outdoor');
  const indoor = volunteerAssignments.filter(v => v.category === 'Indoor');

  assert.equal(outdoor.length, 2);
  assert.equal(indoor.length, 13);

  // Check Outdoor sports
  const football = volunteerAssignments.find(v => v.sport === 'Football');
  assert.ok(football);
  assert.deepEqual(football.volunteers, ['Nasim']);

  const cricket = volunteerAssignments.find(v => v.sport === 'Cricket');
  assert.ok(cricket);
  assert.deepEqual(cricket.volunteers, ['Apu']);

  // Check Indoor sports
  const ludo = volunteerAssignments.find(v => v.sport === 'Ludo');
  assert.ok(ludo);
  assert.deepEqual(ludo.volunteers, ['Ramisa', 'Mahi']);

  const uno = volunteerAssignments.find(v => v.sport === 'UNO');
  assert.ok(uno);
  assert.deepEqual(uno.volunteers, ['Fatema', 'Raisa']);

  const pillowPassing = volunteerAssignments.find(v => v.sport === 'Pillow Passing');
  assert.ok(pillowPassing);
  assert.deepEqual(pillowPassing.volunteers, ['All Girls']);

  const chess = volunteerAssignments.find(v => v.sport === 'Chess');
  assert.ok(chess);
  assert.deepEqual(chess.volunteers, ['Sami']);

  const dart = volunteerAssignments.find(v => v.sport === 'Dart');
  assert.ok(dart);
  assert.deepEqual(dart.volunteers, ['Goutom']);

  const fifa = volunteerAssignments.find(v => v.sport === 'FIFA');
  assert.ok(fifa);
  assert.deepEqual(fifa.volunteers, ['Surjo']);

  const eFootball = volunteerAssignments.find(v => v.sport === 'E-Football');
  assert.ok(eFootball);
  assert.deepEqual(eFootball.volunteers, ['Arko']);

  const bigTwo = volunteerAssignments.find(v => v.sport === 'Big 2 & Call Bridge');
  assert.ok(bigTwo);
  assert.deepEqual(bigTwo.volunteers, ['Arnob']);

  const twentyNine = volunteerAssignments.find(v => v.sport === '29 Card');
  assert.ok(twentyNine);
  assert.deepEqual(twentyNine.volunteers, ['Nazmul']);

  const miniMilitia = volunteerAssignments.find(v => v.sport === 'Mini Militia');
  assert.ok(miniMilitia);
  assert.deepEqual(miniMilitia.volunteers, ['Surjo', 'Arko']);

  const carrom = volunteerAssignments.find(v => v.sport === 'Carrom');
  assert.ok(carrom);
  assert.deepEqual(carrom.volunteers, ['Sajeeb']);

  const penFight = volunteerAssignments.find(v => v.sport === 'Pen Fight');
  assert.ok(penFight);
  assert.deepEqual(penFight.volunteers, ['Estiak']);

  const tableTennis = volunteerAssignments.find(v => v.sport === 'Table Tennis');
  assert.ok(tableTennis);
  assert.deepEqual(tableTennis.volunteers, ['Arnob Sabit']);
});

test('getUniqueVolunteers handles multi-sport leads correctly', () => {
  const unique = getUniqueVolunteers();

  // Surjo is assigned to FIFA & Mini Militia
  const surjo = unique.find(v => v.name === 'Surjo');
  assert.ok(surjo);
  assert.equal(surjo.sports.length, 2);
  const surjoSports = surjo.sports.map(s => s.sport);
  assert.ok(surjoSports.includes('FIFA'));
  assert.ok(surjoSports.includes('Mini Militia'));

  // Arko is assigned to E-Football & Mini Militia
  const arko = unique.find(v => v.name === 'Arko');
  assert.ok(arko);
  assert.equal(arko.sports.length, 2);
  const arkoSports = arko.sports.map(s => s.sport);
  assert.ok(arkoSports.includes('E-Football'));
  assert.ok(arkoSports.includes('Mini Militia'));

  // Arnob Sabit is distinct from Arnob
  const arnob = unique.find(v => v.name === 'Arnob');
  assert.ok(arnob);
  assert.equal(arnob.sports[0].sport, 'Big 2 & Call Bridge');

  const arnobSabit = unique.find(v => v.name === 'Arnob Sabit');
  assert.ok(arnobSabit);
  assert.equal(arnobSabit.sports[0].sport, 'Table Tennis');

  // All Girls is recognized with isSpecialGroup
  const allGirls = unique.find(v => v.name.toLowerCase().includes('all girls'));
  assert.ok(allGirls);
  assert.equal(allGirls.isSpecialGroup, true);
});
