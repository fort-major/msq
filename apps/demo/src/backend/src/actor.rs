#[ic_cdk::update]
fn greet_certified(name: String) -> String {
    ic_cdk::println!("update executed");

    format!("[update - {}] Hello, {}!", ic_cdk::caller(), name)
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    ic_cdk::println!("query executed");

    format!("[query - {}] Hello, {}!", ic_cdk::caller(), name)
}
