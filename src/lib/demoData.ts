import { supabase } from './supabase';

export async function generateDemoData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let company = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company.data) {
      const { data: newCompany } = await supabase
        .from('companies')
        .insert([{
          name: 'ABC Real Estate Development',
          registration_number: 'REG-2024-001',
          email: 'info@abcrealestate.com',
          phone: '+1-555-1234',
          address: '123 Business St',
          city: 'New York',
          country: 'USA',
          owner_id: user.id,
        }])
        .select('id')
        .maybeSingle();
      company.data = newCompany;
    }

    const companyId = company.data!.id;

    const projectData = [
      { code: 'PROJ-001', name: 'Downtown Plaza', location: 'Manhattan', type: 'Residential', budget: 50000000 },
      { code: 'PROJ-002', name: 'Sunset Villas', location: 'Brooklyn', type: 'Residential', budget: 35000000 },
    ];

    const projects: any[] = [];
    for (const proj of projectData) {
      const { data: existing } = await supabase
        .from('real_estate_projects')
        .select('id')
        .eq('company_id', companyId)
        .eq('project_code', proj.code)
        .maybeSingle();

      if (!existing) {
        const { data: newProj } = await supabase
          .from('real_estate_projects')
          .insert([{
            company_id: companyId,
            project_code: proj.code,
            project_name: proj.name,
            location: proj.location,
            project_type: proj.type,
            status: 'Active',
            start_date: '2024-01-01',
            expected_completion_date: '2025-12-31',
            total_budget: proj.budget,
            currency: 'USD',
          }])
          .select('id')
          .maybeSingle();
        projects.push(newProj);
      }
    }

    const units = [
      { code: 'APT-101', name: 'Luxury Apartment 101', type: 'Apartment', price: 500000, area: 1200, beds: 2, baths: 2, proj: 0 },
      { code: 'APT-102', name: 'Luxury Apartment 102', type: 'Apartment', price: 520000, area: 1300, beds: 3, baths: 2, proj: 0 },
      { code: 'VILLA-01', name: 'Modern Villa 01', type: 'Villa', price: 1200000, area: 3000, beds: 4, baths: 3, proj: 1 },
      { code: 'VILLA-02', name: 'Modern Villa 02', type: 'Villa', price: 1350000, area: 3500, beds: 5, baths: 4, proj: 1 },
    ];

    for (const unit of units) {
      const { data: existing } = await supabase
        .from('real_estate_units')
        .select('id')
        .eq('company_id', companyId)
        .eq('unit_code', unit.code)
        .maybeSingle();

      if (!existing && projects[unit.proj]) {
        await supabase
          .from('real_estate_units')
          .insert([{
            company_id: companyId,
            project_id: projects[unit.proj]?.id,
            unit_code: unit.code,
            unit_name: unit.name,
            unit_type: unit.type,
            price: unit.price,
            area_sqm: unit.area,
            bedrooms: unit.beds,
            bathrooms: unit.baths,
            status: 'Available',
            location: unit.proj === 0 ? 'Manhattan' : 'Brooklyn',
          }]);
      }
    }

    const customerData = [
      { name: 'John Smith', contact: 'John', email: 'john@example.com', phone: '+1-555-1001' },
      { name: 'Sarah Johnson', contact: 'Sarah', email: 'sarah@example.com', phone: '+1-555-1002' },
      { name: 'Michael Brown', contact: 'Michael', email: 'michael@example.com', phone: '+1-555-1003' },
    ];

    for (const cust of customerData) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', cust.name)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('customers')
          .insert([{
            company_id: companyId,
            name: cust.name,
            contact_person: cust.contact,
            email: cust.email,
            phone: cust.phone,
            status: 'Active',
          }]);
      }
    }

    const warehouseData = [
      { name: 'Main Warehouse', location: 'Manhattan', manager: 'David Lee' },
      { name: 'Secondary Warehouse', location: 'Queens', manager: 'Lisa Chen' },
    ];

    for (const wh of warehouseData) {
      const { data: existing } = await supabase
        .from('warehouses')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', wh.name)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('warehouses')
          .insert([{
            company_id: companyId,
            name: wh.name,
            location: wh.location,
            manager_name: wh.manager,
            capacity_tons: 5000,
            status: 'Active',
          }]);
      }
    }

    const supplierData = [
      { name: 'Steel & Materials Co', type: 'Materials', contact: 'Bob', phone: '+1-555-2001' },
      { name: 'ProConstruction Services', type: 'Services', contact: 'Alice', phone: '+1-555-2002' },
    ];

    for (const sup of supplierData) {
      const { data: existing } = await supabase
        .from('suppliers')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', sup.name)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('suppliers')
          .insert([{
            company_id: companyId,
            name: sup.name,
            classification: sup.type,
            contact_person: sup.contact,
            phone: sup.phone,
            status: 'Active',
          }]);
      }
    }

    return { success: true, companyId };
  } catch (error) {
    console.error('Demo data generation error:', error);
    throw error;
  }
}
