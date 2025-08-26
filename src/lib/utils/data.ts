import { Employee, Team, Country } from '../models/types';
import employeesData from '../data/employees.json';
import teamsData from '../data/teams.json';
import countriesData from '../data/countries.json';

// In-memory data store (persists during server session)
let employees: Employee[] = [...employeesData];
let teams: Team[] = [...teamsData];
let countries: Country[] = [...countriesData];

// Employee operations
export function getEmployees(): Employee[] {
  return employees;
}

export function getEmployeeByName(name: string): Employee | undefined {
  return employees.find(emp => 
    emp.name.toLowerCase() === name.toLowerCase()
  );
}

export function getEmployeeById(id: string): Employee | undefined {
  return employees.find(emp => emp.id === id);
}

export function addEmployee(employee: Employee): void {
  employees.push(employee);
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) return null;
  
  employees[index] = { ...employees[index], ...updates };
  return employees[index];
}

export function deleteEmployee(id: string): boolean {
  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) return false;
  
  employees.splice(index, 1);
  return true;
}

// Team operations  
export function getTeams(): Team[] {
  return teams;
}

export function getTeamByName(name: string): Team | undefined {
  return teams.find(team => 
    team.name.toLowerCase() === name.toLowerCase()
  );
}

// Country operations
export function getCountries(): Country[] {
  return countries;
}

export function getCountryByName(name: string): Country | undefined {
  return countries.find(country => 
    country.name.toLowerCase() === name.toLowerCase()
  );
}

export function isCountrySupported(countryName: string): boolean {
  const country = getCountryByName(countryName);
  return country ? country.supported && !country.embargoed : false;
}

// Utility functions
export function generateEmployeeId(): string {
  const maxId = employees.reduce((max, emp) => {
    const num = parseInt(emp.id.replace('emp_', ''));
    return num > max ? num : max;
  }, 0);
  
  return `emp_${String(maxId + 1).padStart(3, '0')}`;
}

export function findEmployeesByPartialName(partialName: string): Employee[] {
  return employees.filter(emp =>
    emp.name.toLowerCase().includes(partialName.toLowerCase())
  );
}